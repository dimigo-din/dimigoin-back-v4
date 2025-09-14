import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as webPush from 'web-push';
import { PushSubscription, User } from '../../../schemas';
import { UserJWT } from "../../../common/mapper/types";
import { CreateSubscriptionDto, PushPayloadDTO } from '../dto/push.dto';
import { safeFindOne } from 'src/common/utils/safeFindOne.util';

@Injectable()
export class PushStudentService {
  private readonly logger = new Logger(PushStudentService.name);

  private readonly CONCURRENCY = Number(process.env.PUSH_CONCURRENCY ?? 50);
  private readonly TTL = Number(process.env.PUSH_TTL_SEC ?? 60);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushRepository: Repository<PushSubscription>,
  ) {
    webPush.setVapidDetails(
      process.env.VAPID_CONTACT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }
  async upsertSubscription(user: UserJWT, dto: CreateSubscriptionDto) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    const found = await this.pushRepository.findOne({ where: { endpoint: dto.endpoint } });
    if (found) {
      found.p256dh = dto.keys.p256dh;
      found.auth = dto.keys.auth;
      found.user = target;
      found.expirationTime = dto.expirationTime?.toString() ?? null;
      return this.pushRepository.save(found);
    }
    const sub = this.pushRepository.create({
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      user: target,
      expirationTime: dto.expirationTime?.toString() ?? null,
    });
    return this.pushRepository.save(sub);
  }

  async removeByEndpoint(endpoint: string) {
    await this.pushRepository.delete({ endpoint });
  }

  async removeAllByUser(user: UserJWT) {
    const target = await safeFindOne<User>(this.userRepository, user.id);

    await this.pushRepository.delete({ user: target });
  }
}
