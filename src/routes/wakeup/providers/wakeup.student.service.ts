import { youtube } from "@googleapis/youtube";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { format, startOfWeek } from "date-fns";
import { and, eq, sql } from "drizzle-orm";
import { wakeupSongApplication, wakeupSongVote } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import type { UserJWT, YoutubeSearchResults, YoutubeVideoItem } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { notDeleted } from "$utils/softDelete.util";
import { andWhere } from "$utils/where.util";
import { UserManageService } from "~user/providers";
import {
  RegisterVideoDTO,
  SearchVideoDTO,
  VoteIdDTO,
  VoteVideoDTO,
} from "~wakeup/dto/wakeup.student.dto";

@Injectable()
export class WakeupStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async search(userJwt: UserJWT, data: SearchVideoDTO) {
    if (!(await this.cacheService.musicSearchRateLimit(userJwt.id))) {
      throw new HttpException(ErrorMsg.RateLimit_Exceeded(), HttpStatus.TOO_MANY_REQUESTS);
    }

    const yt = youtube("v3");
    const search = await yt.search.list({
      key: this.configService.get<string>("GCP_YOUTUBE_DATA_API_KEY"),
      part: ["snippet"],
      type: ["video"],
      videoCategoryId: "10",
      q: data.query,
      maxResults: 10,
    });

    await this.cacheService.cacheSearchResults(search.data as YoutubeSearchResults);

    return search.data;
  }

  async getApplications(userJwt: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const gender = (await this.userManageService.checkUserDetail(userJwt.email, { gender: "male" }))
      ? "male"
      : "female";

    const results = await this.db
      .select({
        id: wakeupSongApplication.id,
        video_id: wakeupSongApplication.video_id,
        video_title: wakeupSongApplication.video_title,
        video_thumbnail: wakeupSongApplication.video_thumbnail,
        video_channel: wakeupSongApplication.video_channel,
        week: wakeupSongApplication.week,
        gender: wakeupSongApplication.gender,
        userId: wakeupSongApplication.userId,
        deletedAt: wakeupSongApplication.deletedAt,
        up: sql<number>`SUM(CASE WHEN ${wakeupSongVote.upvote} = true THEN 1 ELSE 0 END)::int`,
        down: sql<number>`SUM(CASE WHEN ${wakeupSongVote.upvote} = false THEN 1 ELSE 0 END)::int`,
      })
      .from(wakeupSongApplication)
      .leftJoin(
        wakeupSongVote,
        eq(wakeupSongVote.wakeupSongApplicationId, wakeupSongApplication.id),
      )
      .where(
        and(
          eq(wakeupSongApplication.week, week),
          eq(wakeupSongApplication.gender, gender),
          notDeleted(wakeupSongApplication),
        ),
      )
      .groupBy(wakeupSongApplication.id);

    return results;
  }

  async registerVideo(userJwt: UserJWT, data: RegisterVideoDTO) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const gender = (await this.userManageService.checkUserDetail(userJwt.email, { gender: "male" }))
      ? "male"
      : "female";

    const exists = await this.db.query.wakeupSongApplication.findFirst({
      where: {
        RAW: (t, { and, eq, isNull }) =>
          andWhere(
            and,
            eq(t.video_id, data.videoId),
            eq(t.week, week),
            eq(t.gender, gender),
            isNull(t.deletedAt),
          ),
      },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.ResourceAlreadyExists(), HttpStatus.BAD_REQUEST);
    }

    let videoData: YoutubeVideoItem;

    const cache = await this.cacheService.getCachedVideo(data.videoId);
    if (!cache) {
      const yt = youtube("v3");
      const search = await yt.search.list({
        key: this.configService.get<string>("GCP_YOUTUBE_DATA_API_KEY"),
        part: ["snippet"],
        type: ["video"],
        q: data.videoId,
        maxResults: 1,
      });
      videoData = (search.data.items?.[0] as YoutubeVideoItem) || null;
    } else {
      videoData = cache;
    }
    if (!videoData) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    try {
      const [application] = await this.db
        .insert(wakeupSongApplication)
        .values({
          video_id: videoData.id.videoId,
          video_title: videoData.snippet.title,
          video_thumbnail: videoData.snippet.thumbnails.default.url,
          video_channel: videoData.snippet.channelTitle,
          week: week,
          gender: gender,
          userId: dbUser.id,
        })
        .returning();

      return application;
    } catch (_e) {}
  }

  async getMyVotes(userJwt: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    return await this.db.query.wakeupSongVote
      .findMany({
        where: {
          RAW: (t, { and, eq, isNull }) =>
            andWhere(and, eq(t.userId, userJwt.id), isNull(t.deletedAt)),
        },
        with: {
          wakeupSongApplication: true,
        },
      })
      .then((votes) => votes.filter((v) => v.wakeupSongApplication?.week === week));
  }

  async vote(userJwt: UserJWT, data: VoteVideoDTO) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );
    const gender = (await this.userManageService.checkUserDetail(userJwt.email, { gender: "male" }))
      ? "male"
      : "female";

    const application = await findOrThrow(
      this.db.query.wakeupSongApplication.findFirst({
        where: {
          RAW: (t, { and, eq, isNull }) =>
            andWhere(and, eq(t.id, data.songId), eq(t.gender, gender), isNull(t.deletedAt)),
        },
      }),
    );

    const exists = await this.db.query.wakeupSongVote.findFirst({
      where: {
        RAW: (t, { and, eq, isNull }) =>
          andWhere(
            and,
            eq(t.userId, dbUser.id),
            eq(t.wakeupSongApplicationId, application.id),
            isNull(t.deletedAt),
          ),
      },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.ResourceAlreadyExists(), HttpStatus.BAD_REQUEST);
    }

    const [vote] = await this.db
      .insert(wakeupSongVote)
      .values({
        upvote: data.upvote,
        wakeupSongApplicationId: application.id,
        userId: dbUser.id,
      })
      .returning();

    return vote;
  }

  async unVote(userJwt: UserJWT, data: VoteIdDTO) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );
    const vote = await findOrThrow(
      this.db.query.wakeupSongVote.findFirst({
        where: {
          RAW: (t, { and, eq, isNull }) =>
            andWhere(and, eq(t.userId, dbUser.id), eq(t.id, data.id), isNull(t.deletedAt)),
        },
      }),
    );

    await this.db.delete(wakeupSongVote).where(eq(wakeupSongVote.id, vote.id));

    return vote;
  }
}
