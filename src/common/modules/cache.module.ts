import * as crypto from "crypto";

import { Cache, CACHE_MANAGER, CacheModule } from "@nestjs/cache-manager";
import { Inject, Injectable, Module } from "@nestjs/common";

import { YoutubeVideoItem, YoutubeSearchResults } from "../mapper/types";

const cacheModule = CacheModule.register();

export class CacheService {
  private RATELIMIT_PREFIX = "ratelimit_";
  private YOUTUBESEARCH_PREFIX = "youtubeSearch_";
  private PERSONALINFORMATIONVERIFY_SECRET = "PersonalInformationVerifyTokenSecret";

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

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
    console.log(this.YOUTUBESEARCH_PREFIX + videoId);
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
}

@Module({
  imports: [cacheModule],
  providers: [CacheService],
  exports: [CacheService, cacheModule],
})
export class CustomCacheModule {}
