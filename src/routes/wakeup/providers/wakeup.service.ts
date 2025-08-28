import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { WakeupSongHistory } from "../../../schemas";
import { GetDateSongDTO } from "../dto/wakeup.dto";

@Injectable()
export class WakeupService {
  constructor(
    @InjectRepository(WakeupSongHistory)
    private readonly wakeupSongHistoryRepository: Repository<WakeupSongHistory>,
  ) {}

  async getDateSong(data: GetDateSongDTO) {
    const song = await this.wakeupSongHistoryRepository.find({ where: { date: data.date } });
    if (!song) throw new HttpException(ErrorMsg.NoWakeupInDate(), HttpStatus.NOT_FOUND);

    return song[song.length - 1];
  }
}
