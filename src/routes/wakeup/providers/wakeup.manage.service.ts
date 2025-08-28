import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { Repository } from "typeorm";

import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { WakeupSongApplication, WakeupSongHistory, WakeupSongVote } from "../../../schemas";
import { WakeupSongDeleteDTO, WakeupSongSelectDTO } from "../dto/wakeup.manage.dto";

@Injectable()
export class WakeupManageService {
  constructor(
    @InjectRepository(WakeupSongApplication)
    private readonly wakeupSongApplicationRepository: Repository<WakeupSongApplication>,
    @InjectRepository(WakeupSongVote)
    private readonly wakeupSongVoteRepository: Repository<WakeupSongVote>,
    @InjectRepository(WakeupSongHistory)
    private readonly wakeupSongHistoryRepository: Repository<WakeupSongHistory>,
  ) {}

  async getList() {
    const week = moment().startOf("week").format("YYYY-MM-DD");

    return await this.wakeupSongApplicationRepository.find({
      where: {
        week: week,
      },
      relations: { wakeupSongVote: true, user: true },
    });
  }

  async selectApply(data: WakeupSongSelectDTO) {
    const week = moment().startOf("week").format("YYYY-MM-DD");
    const apply = await safeFindOne<WakeupSongApplication>(this.wakeupSongApplicationRepository, {
      where: { id: data.id },
      relations: { wakeupSongVote: true },
    });

    const history = new WakeupSongHistory();
    history.date = moment().format("YYYY-MM-DD");
    history.video_id = apply.video_id;
    history.up = apply.wakeupSongVote.filter((v) => v.upvote).length;
    history.down = apply.wakeupSongVote.filter((v) => !v.upvote).length;
    history.gender = apply.gender;

    await this.wakeupSongHistoryRepository.save(history);

    return await this.wakeupSongApplicationRepository.softRemove(apply);
  }

  async deleteApply(data: WakeupSongDeleteDTO) {
    const apply = await safeFindOne<WakeupSongApplication>(this.wakeupSongApplicationRepository, {
      where: { id: data.id },
      relations: { wakeupSongVote: true },
    });

    return await this.wakeupSongApplicationRepository.softRemove(apply);
  }
}
