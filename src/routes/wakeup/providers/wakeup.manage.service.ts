import { Inject, Injectable } from "@nestjs/common";
import { format, startOfWeek } from "date-fns";
import { eq } from "drizzle-orm";
import { wakeupSongApplication, wakeupSongHistory, wakeupSongVote } from "#/db/schema";
import { wakeupSongApplicationWithVotes, wakeupSongApplicationWithVotesAndUser } from "#/db/with";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { softDelete } from "$utils/softDelete.util";
import { andWhere } from "$utils/where.util";
import { WakeupSongDeleteDTO, WakeupSongSelectDTO } from "~wakeup/dto/wakeup.manage.dto";

@Injectable()
export class WakeupManageService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getList() {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    return await this.db.query.wakeupSongApplication.findMany({
      where: {
        RAW: (t, { and, eq, isNull }) => andWhere(and, eq(t.week, week), isNull(t.deletedAt)),
      },
      with: wakeupSongApplicationWithVotesAndUser,
    });
  }

  async selectApply(data: WakeupSongSelectDTO) {
    const apply = await findOrThrow(
      this.db.query.wakeupSongApplication.findFirst({
        where: {
          RAW: (t, { and, eq, isNull }) => andWhere(and, eq(t.id, data.id), isNull(t.deletedAt)),
        },
        with: wakeupSongApplicationWithVotes,
      }),
    );

    // Create history record from the application
    await this.db.insert(wakeupSongHistory).values({
      date: format(new Date(), "yyyy-MM-dd"),
      video_id: apply.video_id,
      video_title: apply.video_title,
      up: apply.wakeupSongVote.filter((v: { upvote: boolean }) => v.upvote).length,
      down: apply.wakeupSongVote.filter((v: { upvote: boolean }) => !v.upvote).length,
      gender: apply.gender,
    });

    // Soft delete the application and its votes
    await softDelete(this.db, wakeupSongVote, eq(wakeupSongVote.wakeupSongApplicationId, apply.id));
    await softDelete(this.db, wakeupSongApplication, eq(wakeupSongApplication.id, apply.id));

    return apply;
  }

  async deleteApply(data: WakeupSongDeleteDTO) {
    const apply = await findOrThrow(
      this.db.query.wakeupSongApplication.findFirst({
        where: {
          RAW: (t, { and, eq, isNull }) => andWhere(and, eq(t.id, data.id), isNull(t.deletedAt)),
        },
        with: wakeupSongApplicationWithVotes,
      }),
    );

    // Soft delete the application and its votes (cascade)
    await softDelete(this.db, wakeupSongVote, eq(wakeupSongVote.wakeupSongApplicationId, apply.id));
    await softDelete(this.db, wakeupSongApplication, eq(wakeupSongApplication.id, apply.id));

    return apply;
  }
}
