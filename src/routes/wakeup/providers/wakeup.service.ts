import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { google } from "googleapis";
import * as moment from "moment/moment";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT, YoutubeVideoItem, YoutubeSearchResults } from "../../../common/mapper/types";
import { CacheService } from "../../../common/modules/cache.module";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { User, WakeupSongApplication } from "../../../schemas";
import { RegisterVideoDTO, SearchVideoDTO } from "../dto/wakeup.dto";

@Injectable()
export class WakeupService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WakeupSongApplication)
    private readonly wakeupSongApplicationRepository: Repository<WakeupSongApplication>,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async search(user: UserJWT, data: SearchVideoDTO) {
    if (!(await this.cacheService.musicSearchRateLimit(user.id)))
      throw new HttpException(ErrorMsg.RateLimit_Exceeded(), HttpStatus.TOO_MANY_REQUESTS);

    const youtube = google.youtube("v3");
    const search = await youtube.search.list({
      key: this.configService.get<string>("GCP_YOUTUBE_DATA_API_KEY"),
      part: ["snippet"],
      type: ["video"],
      q: data.query,
      maxResults: 10,
    });

    await this.cacheService.cacheSearchResults(search.data as YoutubeSearchResults);

    return search.data;
  }

  async registerVideo(user: UserJWT, data: RegisterVideoDTO) {
    let videoData: YoutubeVideoItem;

    const cache = await this.cacheService.getCachedVideo(data.videoId);
    console.log(cache);
    if (!cache) {
      const youtube = google.youtube("v3");
      const search = await youtube.search.list({
        key: this.configService.get<string>("GCP_YOUTUBE_DATA_API_KEY"),
        part: ["snippet"],
        type: ["video"],
        q: data.videoId,
        maxResults: 1,
      });
      videoData = (search.data.items[0] as YoutubeVideoItem) || null;
    } else {
      videoData = cache;
    }
    if (!videoData) throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);

    const dbUser = await safeFindOne<User>(this.userRepository, user.id);
    const application = new WakeupSongApplication();
    application.video_id = videoData.id.videoId;
    application.video_title = videoData.snippet.title;
    application.video_thumbnail = (
      videoData.snippet.thumbnails.high ||
      videoData.snippet.thumbnails.medium ||
      videoData.snippet.thumbnails.default
    ).url;
    application.video_channel = videoData.snippet.channelTitle;
    application.week = moment().startOf("week").format("YYYY-MM-DD");
    application.user = dbUser;

    return await this.wakeupSongApplicationRepository.save(application);
  }
}
