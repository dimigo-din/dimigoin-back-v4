import { fcm, fcm_v1 } from "@googleapis/fcm";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { GoogleAuth } from "google-auth-library";
import { pushSubscription } from "#/db/schema";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import {
  GetSubscriptionsByCategoryDTO,
  GetSubscriptionsByUserAndCategoryDTO,
  GetSubscriptionsByUserDTO,
  PushNotificationPayloadDTO,
  PushNotificationToSpecificDTO,
} from "~push/dto/push.manage.dto";

@Injectable()
export class PushManageService {
  private readonly logger = new Logger(PushManageService.name);
  private readonly fcmClient: fcm_v1.Fcm;
  private projectId: string;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
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
    // Find subscriptions that have a subject matching the category
    const subjects = await this.db.query.pushSubject.findMany({
      where: { RAW: (t, { eq }) => eq(t.identifier, data.category) },
      with: { subscription: true },
    });

    const subscriptionIds = [...new Set(subjects.map((s) => s.subscriptionId))];
    if (!subscriptionIds.length) {
      return [];
    }

    return await Promise.all(
      subscriptionIds.map((id) =>
        this.db.query.pushSubscription.findFirst({
          where: { RAW: (t, { eq }) => eq(t.id, id) },
          with: { subjects: true },
        }),
      ),
    ).then((results) => results.filter(Boolean));
  }

  async getSubscriptionsByUser(data: GetSubscriptionsByUserDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    return await this.db.query.pushSubscription.findMany({
      where: { RAW: (t, { eq }) => eq(t.userId, data.id) },
      with: { subjects: true },
    });
  }

  async getSubscriptionsByUserAndCategory(data: GetSubscriptionsByUserAndCategoryDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    const subscriptions = await this.db.query.pushSubscription.findMany({
      where: { RAW: (t, { eq }) => eq(t.userId, data.id) },
      with: { subjects: true },
    });

    return subscriptions.filter(
      (sub) =>
        sub.subjects?.some((s: { identifier: string }) => s.identifier === data.category) ?? false,
    );
  }

  async sendToSpecificUsers(data: PushNotificationToSpecificDTO) {
    const targets = await Promise.all(
      data.to.map(
        async (id) => await this.getSubscriptionsByUserAndCategory({ id, category: data.category }),
      ),
    );
    const flattened = targets
      .flat()
      .filter(
        (subscription): subscription is NonNullable<typeof subscription> =>
          subscription !== null && subscription !== undefined,
      );
    const payloads = flattened.map((s) => ({
      id: s.id,
      token: s.token,
      userId: s.userId,
    }));
    return await this.sendBatch(payloads, data);
  }

  async sendToAll(data: PushNotificationPayloadDTO) {
    const targets = await this.getSubscriptionsByCategory({ category: data.category });
    const payloads = targets
      .filter(
        (subscription): subscription is NonNullable<typeof subscription> =>
          subscription !== null && subscription !== undefined,
      )
      .map((s) => ({ id: s.id, token: s.token, userId: s.userId }));
    return await this.sendBatch(payloads, data);
  }

  private async sendBatch(
    subscriptions: { id: string; token: string; userId: string }[],
    payload: PushNotificationPayloadDTO,
  ) {
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
          if (subscriptions[i]) {
            await this.doPushFailCleanup(subscriptions[i], r.reason);
          }
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

  private async doPushFailCleanup(
    subscription: { id: string; token: string; userId: string },
    reason: unknown,
  ) {
    const code =
      (reason as { statusCode?: number })?.statusCode ||
      (reason as { body?: { statusCode?: number } })?.body?.statusCode;
    if (code === 404 || code === 410) {
      await this.db.delete(pushSubscription).where(eq(pushSubscription.token, subscription.token));
      this.logger.warn(`Removed dead FCM token: ${subscription.token}`);
    } else {
      this.logger.warn(
        `Push send failed: ${subscription.userId ?? subscription.id} code=${code ?? "N/A"} msg=${(reason as Error)?.message ?? reason}`,
      );
    }
  }
}
