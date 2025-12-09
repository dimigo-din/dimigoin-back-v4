import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as admin from "firebase-admin";
import { In, Repository } from "typeorm";

import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { PushSubscription, User } from "../../../schemas";
import {
  GetUserSubscriptionsDTO,
  PushNotificationPayloadDTO,
  PushNotificationToSpecificDTO,
} from "../dto/push.manage.dto";

@Injectable()
export class PushManageService {
  private readonly logger = new Logger(PushManageService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: configService.get<string>("FIREBASE_PROJECT_ID"),
          privateKey: configService.get<string>("FIREBASE_PRIVATE_KEY"),
          clientEmail: configService.get<string>("FIREBASE_CLIENT_EMAIL"),
        }),
      });
    }
  }

  async getSubscriptionsByUser(data: GetUserSubscriptionsDTO) {
    const target = await safeFindOne<User>(this.userRepository, data.id);

    return await this.pushRepository.find({ where: { user: target }, relations: ["subject"] });
  }

  async sendToSpecificUsers(data: PushNotificationToSpecificDTO) {
    const targets = await this.pushRepository.find({ where: { user: { id: In(data.to) } } });

    return await this.sendBatch(targets, data);
  }

  async sendToAll(data: PushNotificationPayloadDTO) {
    const all = await this.pushRepository.find();
    return await this.sendBatch(all, data);
  }

  private async sendBatch(subscriptions: PushSubscription[], payload: PushNotificationPayloadDTO) {
    if (!subscriptions.length) return { sent: 0, failed: 0 };
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
    const fcmPayload = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        body: payload.body,
      },
    };

    try {
      const response = await admin.messaging().send(fcmPayload);
      return { sent_message: response };
    } catch (error: any) {
      throw { statusCode: error.code ?? 500, message: error.message ?? error };
    }
  }

  private async doPushFailCleanup(subscription: PushSubscription, reason: any) {
    const code = reason?.statusCode || reason?.body?.statusCode;
    if (code === 404 || code === 410) {
      await this.pushRepository.delete({ token: subscription.token });
      this.logger.warn(`Removed dead FCM token: ${subscription.token}`);
    } else {
      this.logger.warn(
        `Push send failed: ${subscription.user.id} code=${code ?? "N/A"} msg=${reason?.message ?? reason}`,
      );
    }
  }
}
