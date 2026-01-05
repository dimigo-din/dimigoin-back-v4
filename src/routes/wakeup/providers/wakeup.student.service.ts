import { youtube } from "@googleapis/youtube";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { format, startOfWeek } from "date-fns";
import type { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import type { UserJWT, YoutubeSearchResults, YoutubeVideoItem } from "../../../common/mapper/types";
import { CacheService } from "../../../common/modules/cache.module";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { User, WakeupSongApplication, WakeupSongVote } from "../../../schemas";
import { UserManageService } from "../../user/providers";
import type {
  RegisterVideoDTO,
  SearchVideoDTO,
  VoteIdDTO,
  VoteVideoDTO,
} from "../dto/wakeup.student.dto";

@Injectable()
export class WakeupStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WakeupSongApplication)
    private readonly wakeupSongApplicationRepository: Repository<WakeupSongApplication>,
    @InjectRepository(WakeupSongVote)
    private readonly wakeupSongVoteRepository: Repository<WakeupSongVote>,
    private readonly userManageService: UserManageService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async search(user: UserJWT, data: SearchVideoDTO) {
    if (!(await this.cacheService.musicSearchRateLimit(user.id))) {
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

  async getApplications(user: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    const applications = await this.wakeupSongApplicationRepository
      .createQueryBuilder("application")
      .leftJoin("application.wakeupSongVote", "vote")
      .select("application")
      .addSelect("SUM(CASE WHEN vote.upvote = true THEN 1 ELSE 0 END)", "up")
      .addSelect("SUM(CASE WHEN vote.upvote = false THEN 1 ELSE 0 END)", "down")
      .where("application.week = :week AND application.gender = :gender", {
        week: week,
        gender: (await this.userManageService.checkUserDetail(user.email, { gender: "male" }))
          ? "male"
          : "female",
      })
      .groupBy("application.id")
      .getRawAndEntities();

    const result = applications.entities.map((app, index) => ({
      ...app,
      up: parseInt(applications.raw[index].up, 10) || 0,
      down: parseInt(applications.raw[index].down, 10) || 0,
    }));

    return result;
  }

  async registerVideo(user: UserJWT, data: RegisterVideoDTO) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    const exists = await this.wakeupSongApplicationRepository.findOne({
      where: {
        video_id: data.videoId,
        week: week,
        gender: (await this.userManageService.checkUserDetail(user.email, { gender: "male" }))
          ? "male"
          : "female",
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

    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const application = new WakeupSongApplication();
    application.video_id = videoData.id.videoId;
    application.video_title = videoData.snippet.title;
    application.video_thumbnail = videoData.snippet.thumbnails.default.url;
    application.video_channel = videoData.snippet.channelTitle;
    application.week = week;
    application.gender = (await this.userManageService.checkUserDetail(user.email, {
      gender: "male",
    }))
      ? "male"
      : "female";
    application.user = dbUser;

    try {
      return await this.wakeupSongApplicationRepository.save(application);
    } catch (_error) {}
  }

  async getMyVotes(user: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    return await this.wakeupSongVoteRepository.find({
      where: { user: dbUser, wakeupSongApplication: { week: week } },
      relations: { wakeupSongApplication: true },
    });
  }

  async vote(user: UserJWT, data: VoteVideoDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const application = await safeFindOne<WakeupSongApplication>(
      this.wakeupSongApplicationRepository,
      {
        where: {
          id: data.songId,
          gender: (await this.userManageService.checkUserDetail(user.email, { gender: "male" }))
            ? "male"
            : "female",
        },
      },
    );

    const exists = await this.wakeupSongVoteRepository.findOne({
      where: { user: dbUser, wakeupSongApplication: application },
    });
    if (exists) {
      throw new HttpException(ErrorMsg.ResourceAlreadyExists(), HttpStatus.BAD_REQUEST);
    }

    const wakeupSongVote = new WakeupSongVote();
    wakeupSongVote.upvote = data.upvote;
    wakeupSongVote.wakeupSongApplication = application;
    wakeupSongVote.user = dbUser;

    return await this.wakeupSongVoteRepository.save(wakeupSongVote);
  }

  async unVote(user: UserJWT, data: VoteIdDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const vote = await safeFindOne<WakeupSongVote>(this.wakeupSongVoteRepository, {
      where: { user: dbUser, id: data.id },
    });

    return await this.wakeupSongVoteRepository.remove(vote);
  }
}
