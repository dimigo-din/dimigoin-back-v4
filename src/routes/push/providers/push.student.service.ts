import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as webPush from "web-push";

import { safeFindOne } from "src/common/utils/safeFindOne.util";

import { PushTokenTypeValues, UserJWT } from "../../../common/mapper/types";
import { PushSubscription, User } from "../../../schemas";
import { CreateFCMTokenDTO, CreateSubscriptionDTO, DeleteFCMTokenDTO, DeleteSubscriptionByEndpointDTO } from "../dto/push.student.dto";

@Injectable()
export class PushStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {
    webPush.setVapidDetails(
      configService.get<string>("VAPID_CONTACT"),
      configService.get<string>("VAPID_PUBLIC_KEY"),
      configService.get<string>("VAPID_PRIVATE_KEY"),
    );
  }

  async upsertSubscription(user: UserJWT, data: CreateSubscriptionDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription =
      (await this.pushSubscriptionRepository.findOne({ where: { user: target } })) ||
      new PushSubscription();

    subscription.endpoint = data.endpoint;
    subscription.p256dh = data.keys.p256dh;
    subscription.auth = data.keys.auth;
    subscription.user = target;
    subscription.expirationTime = data.expirationTime;
    subscription.tokenType = "web";

    return this.pushSubscriptionRepository.save(subscription);
  }

  async removeByEndpoint(data: DeleteSubscriptionByEndpointDTO) {
    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { endpoint: data.endpoint },
    });

    return await this.pushSubscriptionRepository.remove(subscription);
  }

  async removeAllByUser(user: UserJWT) {
    const subscriptions = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { user: { id: user.id } },
    });

    return await this.pushSubscriptionRepository.remove(subscriptions);
  }

  async upsertFCMToken(user: UserJWT, data: CreateFCMTokenDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription =
      (await this.pushSubscriptionRepository.findOne({ where: { user: target } })) ||
      new PushSubscription();

    subscription.fcmToken = data.token;
    subscription.deviceName = data.deviceName;
    subscription.user = target;
    subscription.tokenType = "fcm";

    return this.pushSubscriptionRepository.save(subscription);
  }

  async removeFCMToken(data: DeleteFCMTokenDTO) {
    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { fcmToken: data.token },
    });

    return await this.pushSubscriptionRepository.remove(subscription);
  }
}
