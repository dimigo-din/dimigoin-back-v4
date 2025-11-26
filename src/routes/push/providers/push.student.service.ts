import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { safeFindOne } from "src/common/utils/safeFindOne.util";

import { UserJWT } from "../../../common/mapper/types";
import { PushSubscription, User } from "../../../schemas";
import { CreateFCMTokenDTO, DeleteFCMTokenDTO } from "../dto/push.student.dto";

@Injectable()
export class PushStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
  ) {}

  async upsertToken(user: UserJWT, data: CreateFCMTokenDTO) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const subscription =
      (await this.pushSubscriptionRepository.findOne({
        where: { user: target, deviceId: data.deviceId },
      })) || new PushSubscription();

    subscription.fcmToken = data.token;
    subscription.deviceId = data.deviceId;
    subscription.user = target;

    return this.pushSubscriptionRepository.save(subscription);
  }

  async removeToken(data: DeleteFCMTokenDTO) {
    const subscription = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { fcmToken: data.token },
    });

    return await this.pushSubscriptionRepository.remove(subscription);
  }

  async removeAllByUser(user: UserJWT) {
    const subscriptions = await safeFindOne<PushSubscription>(this.pushSubscriptionRepository, {
      where: { user: { id: user.id } },
    });

    return await this.pushSubscriptionRepository.remove(subscriptions);
  }
}
