import { CACHE_MANAGER, Cache, CacheModule } from "@nestjs/cache-manager";
import { Inject, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisClient } from "bun";
import { YoutubeSearchResults, YoutubeVideoItem } from "$mapper/types";
import { CachedTimetable } from "~user/dto";

class BunRedisStore {
  constructor(private readonly client: RedisClient) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: RedisClient.KeyLike, value: RedisClient.KeyLike, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, "PX", ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: RedisClient.KeyLike) {
    return (await this.client.del(key)) > 0;
  }

  async clear() {
    return undefined;
  }
}

const cacheModule = CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    skipMemory: true,
    stores: [
      await (async () => {
        const client = new RedisClient(configService.get<string>("REDIS_HOST"));
        await client.set("ok", "true");
        return new BunRedisStore(client);
      })(),
    ],
  }),
});

export class CacheService {
  private RATELIMIT_PREFIX = "ratelimit_";
  private YOUTUBESEARCH_PREFIX = "youtubeSearch_";
  private NOTIFICATION_PREFIX = "notification_";
  private PERSONALINFORMATIONVERIFY_SECRET = "PersonalInformationVerifyTokenSecret";
  private redis: RedisClient;
  private logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.redis = new RedisClient(this.configService.get<string>("REDIS_HOST") ?? "localhost");
  }

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
      this.logger.log(this.YOUTUBESEARCH_PREFIX + result.id.videoId);
    }
  }

  async getCachedVideo(videoId: string) {
    return await this.cacheManager.get<YoutubeVideoItem>(this.YOUTUBESEARCH_PREFIX + videoId);
  }

  async getPersonalInformationVerifyTokenSecret(): Promise<string> {
    const secret = await this.cacheManager.get<string>(this.PERSONALINFORMATIONVERIFY_SECRET);
    if (secret) {
      return secret;
    }

    await this.cacheManager.set(this.PERSONALINFORMATIONVERIFY_SECRET, Bun.randomUUIDv7());

    return await this.getPersonalInformationVerifyTokenSecret();
  }

  async setCachedTimetable(grade: number, klass: number, data: CachedTimetable[][]) {
    const cacheKey = `timetable:${grade}:${klass}`;
    await this.cacheManager.set(cacheKey, data, 1000 * 60 * 30);
  }

  async getCachedTimetable(grade: number, klass: number): Promise<CachedTimetable[][] | undefined> {
    const cacheKey = `timetable:${grade}:${klass}`;
    const cached = await this.cacheManager.get<CachedTimetable[][]>(cacheKey);
    return cached;
  }

  async isNotificationAlreadySent(id: string): Promise<boolean> {
    const key = this.NOTIFICATION_PREFIX + id;

    const isThisCluster = Bun.randomUUIDv7();
    await this.redis.set(key, isThisCluster, "EX", "3600", "NX");
    return (await this.redis.get(key)) !== isThisCluster;
  }
}

@Module({
  imports: [cacheModule],
  providers: [CacheService],
  exports: [CacheService, cacheModule],
})
export class CustomCacheModule {}
