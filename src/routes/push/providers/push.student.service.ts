import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { pushSubject, pushSubscription } from "#/db/schema";
import { pushSubscriptionWithSubjects } from "#/db/with";
import {
  PushNotificationSubject,
  PushNotificationSubjectIdentifierValues,
  UserJWT,
} from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import {
  CreateFCMTokenDTO,
  DeleteFCMTokenDTO,
  GetSubscribedSubjectDTO,
  SetSubscribeSubjectDTO,
} from "~push/dto/push.student.dto";

@Injectable()
export class PushStudentService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async upsertToken(userJwt: UserJWT, data: CreateFCMTokenDTO) {
    const target = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const existing = await this.db.query.pushSubscription.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(and, eq(t.userId, target.id), eq(t.deviceId, data.deviceId)),
      },
    });

    if (existing) {
      const [updated] = await this.db
        .update(pushSubscription)
        .set({ token: data.token })
        .where(eq(pushSubscription.id, existing.id))
        .returning();
      return updated;
    }

    const [subscription] = await this.db
      .insert(pushSubscription)
      .values({
        token: data.token,
        deviceId: data.deviceId,
        userId: target.id,
      })
      .returning();

    if (!subscription) {
      throw new Error("Failed to create subscription");
    }

    // Create all default subjects for new subscription
    await this.db.insert(pushSubject).values(
      PushNotificationSubjectIdentifierValues.map((i) => ({
        identifier: i,
        name: PushNotificationSubject[i] ?? "",
        subscriptionId: subscription.id,
        userId: target.id,
      })),
    );

    return await this.db.query.pushSubscription.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, subscription.id) },
      with: pushSubscriptionWithSubjects,
    });
  }

  async removeToken(userJwt: UserJWT, data: DeleteFCMTokenDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const subscription = await findOrThrow(
      this.db.query.pushSubscription.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, userJwt.id), eq(t.token, data.token)),
        },
      }),
    );

    await this.db.delete(pushSubscription).where(eq(pushSubscription.id, subscription.id));

    return subscription;
  }

  async removeAllByUser(userJwt: UserJWT) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    return await this.db.delete(pushSubscription).where(eq(pushSubscription.userId, userJwt.id));
  }

  async getSubjects() {
    return PushNotificationSubject;
  }

  async getSubscribedSubject(userJwt: UserJWT, data: GetSubscribedSubjectDTO) {
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const subscription = await findOrThrow(
      this.db.query.pushSubscription.findFirst({
        where: {
          RAW: (t, { and, eq }) =>
            andWhere(and, eq(t.userId, userJwt.id), eq(t.deviceId, data.deviceId)),
        },
        with: pushSubscriptionWithSubjects,
      }),
    );

    return subscription.subjects;
  }

  async setSubscribeSubject(userJwt: UserJWT, data: SetSubscribeSubjectDTO) {
    const target = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const subscription = await findOrThrow(
      this.db.query.pushSubscription.findFirst({
        where: {
          RAW: (t, { and, eq }) =>
            andWhere(and, eq(t.userId, target.id), eq(t.deviceId, data.deviceId)),
        },
        with: pushSubscriptionWithSubjects,
      }),
    );

    // Remove old subjects
    if (subscription.subjects.length > 0) {
      await this.db.delete(pushSubject).where(eq(pushSubject.subscriptionId, subscription.id));
    }

    // Insert new filtered subjects
    const filteredIdentifiers = PushNotificationSubjectIdentifierValues.filter((i) =>
      data.subjects.includes(i),
    );

    if (filteredIdentifiers.length > 0) {
      await this.db.insert(pushSubject).values(
        filteredIdentifiers.map((i) => ({
          identifier: i,
          name: PushNotificationSubject[i] ?? "",
          subscriptionId: subscription.id,
          userId: target.id,
        })),
      );
    }

    return await this.db.query.pushSubscription.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, subscription.id) },
      with: pushSubscriptionWithSubjects,
    });
  }
}
