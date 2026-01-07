import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { format, startOfWeek } from "date-fns";
import { Repository } from "typeorm";

import { safeFindOne } from "@/common/utils/safeFindOne.util";
import { WakeupSongApplication, WakeupSongHistory } from "@/schemas";
import { WakeupSongDeleteDTO, WakeupSongSelectDTO } from "../dto/wakeup.manage.dto";

@Injectable()
export class WakeupManageService {
  constructor(
    @InjectRepository(WakeupSongApplication)
    private readonly wakeupSongApplicationRepository: Repository<WakeupSongApplication>,
    @InjectRepository(WakeupSongHistory)
    private readonly wakeupSongHistoryRepository: Repository<WakeupSongHistory>,
  ) {}

  async getList() {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    return await this.wakeupSongApplicationRepository.find({
      where: {
        week: week,
      },
      relations: { wakeupSongVote: true, user: true },
    });
  }

  async selectApply(data: WakeupSongSelectDTO) {
    const apply = await safeFindOne<WakeupSongApplication>(this.wakeupSongApplicationRepository, {
      where: { id: data.id },
      relations: { wakeupSongVote: true },
    });

    const history = new WakeupSongHistory();
    history.date = format(new Date(), "yyyy-MM-dd");
    history.video_id = apply.video_id;
    history.video_title = apply.video_title;
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
