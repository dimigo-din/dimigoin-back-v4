import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { safeFindOne } from "src/common/utils/safeFindOne.util";

import {
  PushNotificationSubject,
  PushNotificationSubjectIdentifierValues,
  UserJWT,
} from "../../../common/mapper/types";
import { PushSubject, PushSubscription, User } from "../../../schemas";
import {
  CreateFCMTokenDTO,
  DeleteFCMTokenDTO,
  GetSubscribedSubjectDTO,
  SetSubscribeSubjectDTO,
} from "../dto/push.student.dto";

@Injectable()
export class PushStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    @InjectRepository(PushSubject)
    private readonly pushSubjectRepository: Repository<PushSubject>,
  ) {}

  async upsertToken(user: UserJWT, data: CreateFCMTokenDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription =
      (await this.pushSubscriptionRepository.findOne({
        where: { user: target, deviceId: data.deviceId },
      })) || new PushSubscription();

    subscription.token = data.token;
    subscription.deviceId = data.deviceId;
    subscription.subject = PushNotificationSubjectIdentifierValues.map((i) =>
      Object.assign(new PushSubject(), {
        identifier: i,
        name: PushNotificationSubject[i],
        user: target,
      }),
    );
    subscription.user = target;

    return this.pushSubscriptionRepository.save(subscription);
  }

  async removeToken(user: UserJWT, data: DeleteFCMTokenDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { user: target, token: data.token },
    });

    return await this.pushSubscriptionRepository.remove(subscription);
  }

  async removeAllByUser(user: UserJWT) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscriptions = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { user: target },
    });

    return await this.pushSubscriptionRepository.remove(subscriptions);
  }

  async getSubjects() {
    return PushNotificationSubject;
  }

  async getSubscribedSubject(user: UserJWT, data: GetSubscribedSubjectDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    return (
      await this.pushSubscriptionRepository.findOne({
        where: {
          user: target,
          deviceId: data.deviceId,
        },
      })
    ).subject;
  }

  async setSubscribeSubject(user: UserJWT, data: SetSubscribeSubjectDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: {
        user: target,
        deviceId: data.deviceId,
      },
    });

    subscription.subject = PushNotificationSubjectIdentifierValues.filter((i) =>
      data.subjects.includes(i),
    ).map((i) =>
      Object.assign(new PushSubject(), {
        identifier: i,
        name: PushNotificationSubject[i],
        user: target,
      }),
    );

    return await this.pushSubscriptionRepository.save(subscription);
  }
}
