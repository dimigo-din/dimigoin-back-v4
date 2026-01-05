import { fcm, type fcm_v1 } from "@googleapis/fcm";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { GoogleAuth } from "google-auth-library";
import type { Repository } from "typeorm";

import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { PushSubscription, User } from "../../../schemas";
import type {
  GetSubscriptionsByCategoryDTO,
  GetSubscriptionsByUserAndCategoryDTO,
  GetSubscriptionsByUserDTO,
  PushNotificationPayloadDTO,
  PushNotificationToSpecificDTO,
} from "../dto/push.manage.dto";

@Injectable()
export class PushManageService {
  private readonly logger = new Logger(PushManageService.name);
  private readonly fcmClient: fcm_v1.Fcm;
  private projectId: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {
    this.projectId = this.configService.get<string>("FIREBASE_PROJECT_ID") ?? "";
    const googleAuth = new GoogleAuth({
      credentials: {
        client_email: configService.get<string>("FIREBASE_CLIENT_EMAIL"),
        private_key: configService.get<string>("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    this.fcmClient = fcm({
      version: "v1",
      auth: googleAuth,
    });
  }

  async getSubscriptionsByCategory(data: GetSubscriptionsByCategoryDTO) {
    return await this.pushRepository.find({
      where: {
        subjects: { identifier: data.category },
      },
      relations: ["subjects"],
    });
  }

  async getSubscriptionsByUser(data: GetSubscriptionsByUserDTO) {
    const target = await safeFindOne<User>(this.userRepository, data.id);

    return await this.pushRepository.find({ where: { user: target }, relations: ["subjects"] });
  }

  async getSubscriptionsByUserAndCategory(data: GetSubscriptionsByUserAndCategoryDTO) {
    const target = await safeFindOne<User>(this.userRepository, data.id);

    return await this.pushRepository.find({
      where: {
        user: target,
        subjects: { identifier: data.category },
      },
      relations: ["subjects"],
    });
  }

  async sendToSpecificUsers(data: PushNotificationToSpecificDTO) {
    const targets = await Promise.all(
      data.to.map(
        async (id) => await this.getSubscriptionsByUserAndCategory({ id, category: data.category }),
      ),
    );
    return await this.sendBatch(targets.flat(), data);
  }

  async sendToAll(data: PushNotificationPayloadDTO) {
    const targets = await this.getSubscriptionsByCategory({ category: data.category });
    return await this.sendBatch(targets, data);
  }

  private async sendBatch(subscriptions: PushSubscription[], payload: PushNotificationPayloadDTO) {
    if (!subscriptions.length) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      subscriptions.map((row) => {
        return this.sendFCM(row.token, payload);
      }),
    );

    await Promise.all(
      results.map(async (r, i) => {
        if (r.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          await this.doPushFailCleanup(subscriptions[i], r.reason);
        }
      }),
    );
    this.logger.log(`Batch push done: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  }

  private async sendFCM(fcmToken: string, payload: PushNotificationPayloadDTO) {
    try {
      const response = await this.fcmClient.projects.messages.send({
        parent: `projects/${this.projectId}`,
        requestBody: {
          message: {
            token: fcmToken,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              body: payload.body,
            },
          },
        },
      });
      return { sent_message: response.data };
    } catch (error: unknown) {
      const statusCode =
        (error as { code?: number }).code ||
        (error as { response?: { status?: number } }).response?.status ||
        500;
      const message = (error as Error)?.message || "Unknown error";
      throw { statusCode, message };
    }
  }

  private async doPushFailCleanup(subscription: PushSubscription, reason: unknown) {
    const code =
      (reason as { statusCode?: number })?.statusCode ||
      (reason as { body?: { statusCode?: number } })?.body?.statusCode;
    if (code === 404 || code === 410) {
      await this.pushRepository.delete({ token: subscription.token });
      this.logger.warn(`Removed dead FCM token: ${subscription.token}`);
    } else {
      this.logger.warn(
        `Push send failed: ${(subscription.user ?? subscription).id} code=${code ?? "N/A"} msg=${(reason as Error)?.message ?? reason}`,
      );
    }
  }
}
