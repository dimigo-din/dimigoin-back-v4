import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PushSubject, PushSubscription, User } from "#/schemas";
import {
  PushNotificationSubject,
  PushNotificationSubjectIdentifierValues,
  UserJWT,
} from "$mapper/types";
import { safeFindOne } from "$utils/safeFindOne.util";
import {
  CreateFCMTokenDTO,
  DeleteFCMTokenDTO,
  GetSubscribedSubjectDTO,
  SetSubscribeSubjectDTO,
} from "~push/dto/push.student.dto";

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

    let subscription = await this.pushSubscriptionRepository.findOne({
      where: { user: target, deviceId: data.deviceId },
    });

    if (!subscription) {
      subscription = new PushSubscription();
      subscription.deviceId = data.deviceId;
      subscription.subjects = PushNotificationSubjectIdentifierValues.map((i) => {
        const s = new PushSubject();
        s.identifier = i;
        s.name = PushNotificationSubject[i] ?? "";
        s.user = target;

        return s;
      });
      subscription.user = target;
    }
    subscription.token = data.token;

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
      await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
        where: {
          user: target,
          deviceId: data.deviceId,
        },
        relations: ["subjects"],
      })
    ).subjects;
  }

  async setSubscribeSubject(user: UserJWT, data: SetSubscribeSubjectDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: {
        user: target,
        deviceId: data.deviceId,
      },
      relations: ["subjects"],
    });

    await this.pushSubjectRepository.remove(subscription.subjects);

    subscription.subjects = PushNotificationSubjectIdentifierValues.filter((i) =>
      data.subjects.includes(i),
    ).map((i) => {
      const s = new PushSubject();
      s.identifier = i;
      s.name = PushNotificationSubject[i] ?? "";
      s.user = target;

      return s;
    });

    return await this.pushSubscriptionRepository.save(subscription);
  }
}
