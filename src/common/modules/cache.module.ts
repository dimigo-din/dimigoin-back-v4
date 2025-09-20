import * as crypto from "crypto";

import KeyvRedis from "@keyv/redis";
import { Cache, CACHE_MANAGER, CacheModule } from "@nestjs/cache-manager";
import { Inject, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { YoutubeVideoItem, YoutubeSearchResults } from "../mapper/types";

const cacheModule = CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    skipMemory: true,
    stores: [
      await (async () => {
        const store = new KeyvRedis(configService.get<string>("REDIS_HOST"));
        await store.set("ok", "true");
        return store;
      })(),
    ],
  }),
});

export class CacheService {
  private RATELIMIT_PREFIX = "ratelimit_";
  private YOUTUBESEARCH_PREFIX = "youtubeSearch_";
  private NOTIFICATION_PREFIX = "notification_";
  private PERSONALINFORMATIONVERIFY_SECRET = "PersonalInformationVerifyTokenSecret";

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async musicSearchRateLimit(userid: string) {
    const lastRequest = await this.cacheManager.get<number>(this.RATELIMIT_PREFIX + userid);

    if (lastRequest === undefined || Date.now() - lastRequest > 2000) {
      await this.cacheManager.set(this.RATELIMIT_PREFIX + userid, Date.now());
      return true;
    } else {
      return false;
    }
  }

  async cacheSearchResults(results: YoutubeSearchResults) {
    for (const result of results.items) {
      await this.cacheManager.set(
        this.YOUTUBESEARCH_PREFIX + result.id.videoId,
        result,
        1000 * 60 * 10,
      );
      console.log(this.YOUTUBESEARCH_PREFIX + result.id.videoId);
    }
  }

  async getCachedVideo(videoId: string) {
    return await this.cacheManager.get<YoutubeVideoItem>(this.YOUTUBESEARCH_PREFIX + videoId);
  }

  async getPersonalInformationVerifyTokenSecret(): Promise<string> {
    const secret = await this.cacheManager.get<string>(this.PERSONALINFORMATIONVERIFY_SECRET);
    if (secret) return secret;

    await this.cacheManager.set(
      this.PERSONALINFORMATIONVERIFY_SECRET,
      crypto.randomBytes(128).toString("hex"),
    );

    return await this.getPersonalInformationVerifyTokenSecret();
  }

  async isNotificationAlreadySent(id: string): Promise<boolean> {
    if (await this.cacheManager.get<string>(this.NOTIFICATION_PREFIX + id)) return true;
    await this.cacheManager.set<string>(this.NOTIFICATION_PREFIX + id, "sent");
    return false;
  }
}

@Module({
  imports: [cacheModule],
  providers: [CacheService],
  exports: [CacheService, cacheModule],
})
export class CustomCacheModule {}
