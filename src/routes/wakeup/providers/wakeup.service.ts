import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ErrorMsg } from "$mapper/error";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { GetDateSongDTO } from "~wakeup/dto/wakeup.dto";

@Injectable()
export class WakeupService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getDateSong(data: GetDateSongDTO) {
    const songs = await this.db.query.wakeupSongHistory.findMany({
      where: {
        RAW: (t, { and, eq }) => and(eq(t.date, data.date), eq(t.gender, data.gender)),
      },
    });
    if (!songs || songs.length === 0) {
      throw new HttpException(ErrorMsg.NoWakeupInDate(), HttpStatus.NOT_FOUND);
    }

    return songs[songs.length - 1];
  }
}
