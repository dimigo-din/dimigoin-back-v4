import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as webPush from 'web-push';
import { PushSubscription, User } from '../../../schemas';
import { PushPayloadDTO } from '../dto/push.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PushManageService {
  private readonly logger = new Logger(PushManageService.name);

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

  /** 만료된 구독 제거 */
  @Cron(CronExpression.EVERY_HOUR)
  async removeExpired(nowMs = Date.now()) {
    const rows = await this.pushRepository.find();
    const expired = rows.filter(
      (r) => r.expirationTime && Number(r.expirationTime) > 0 && Number(r.expirationTime) < nowMs,
    );
    if (expired.length) {
      await this.pushRepository.remove(expired);
      this.logger.log(`Pruned ${expired.length} expired subscriptions`);
    }
    return expired.length;
  }

  /** 특정 유저의 구독 목록 조회(디버깅/관리용) */
  async getSubscriptionsByUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    return this.pushRepository.find({
      where: { user: user },
      order: { createdAt: 'DESC' },
      select: ['id', 'user', 'endpoint', 'deviceName', 'userAgent', 'expirationTime', 'createdAt', 'updatedAt'],
    });
  }

  /** 유저에게(그 유저의 모든 기기) 전송 */
  async sendToUser(user: string, payload: PushPayloadDTO) {
    const target = await this.userRepository.findOne({ where: { id: user } });
    if (!target) return { sent: 0, failed: 0 };

    const list = await this.pushRepository.find({ where: { user: target } });
    return this.sendBatch(list, payload);
  }

  /** 여러 유저에게 전송 */
  async sendToUsers(users: string[], payload: PushPayloadDTO) {
    if (!users.length) return { sent: 0, failed: 0 };
    const targets = await this.userRepository.find({ where: { id: In(users) } });
    if (!targets.length) return { sent: 0, failed: 0 };

    const list = await this.pushRepository.find({ where: { user: In(targets) } });
    return this.sendBatch(list, payload);
  }

  /** 모든 구독에 전송 */
  async sendToAll(payload: PushPayloadDTO) {
    const all = await this.pushRepository.find();
    return this.sendBatch(all, payload);
  }

  private async sendBatch(rows: PushSubscription[], payload: PushPayloadDTO) {
    if (!rows.length) return { sent: 0, failed: 0 };
    const chunks = this.chunk(rows, this.CONCURRENCY);
    let sent = 0;
    let failed = 0;

    for (const ck of chunks) {
      const results = await Promise.allSettled(
        ck.map((row) => this.sendRaw(row.endpoint, { p256dh: row.p256dh, auth: row.auth }, payload)),
      );
      await Promise.all(
        results.map(async (r, i) => {
          if (r.status === 'fulfilled') {
            sent++;
          } else {
            failed++;
            await this.cleanupIfGone(ck[i], (r as any).reason);
          }
        }),
      );
    }
    this.logger.log(`Batch push done: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  }
  
  private async sendRaw(
    endpoint: string,
    keys: { p256dh: string; auth: string },
    payload: PushPayloadDTO,
  ) {
    // payload는 Service Worker에서 사용: title/body/url/data/actions/icon/badge 등
    return webPush.sendNotification(
      { endpoint, keys } as any,
      JSON.stringify(payload ?? {}),
      { TTL: this.TTL },
    );
  }

  private async cleanupIfGone(row: PushSubscription, reason: any) {
    const code = reason?.statusCode || reason?.body?.statusCode;
    if (code === 404 || code === 410) {
      await this.pushRepository.delete({ endpoint: row.endpoint });
      this.logger.warn(`Removed dead subscription: ${row.endpoint}`);
    } else {
      this.logger.warn(`Push send failed: ${row.endpoint} code=${code ?? 'N/A'} msg=${reason?.message ?? reason}`);
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [arr];
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}
