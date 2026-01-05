import { TZDate } from "@date-fns/tz";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { format } from "date-fns";
import { LessThanOrEqual, MoreThanOrEqual, type Repository } from "typeorm";
import { type LaundryTimeline, Stay } from "../../../schemas";
import { LaundryTimelineScheduler } from "./scheduler.interface";

@Injectable()
export class StayScheduler extends LaundryTimelineScheduler {
  constructor(
    @InjectRepository(Stay)
    private readonly stayRepository: Repository<Stay>,
  ) {
    super();
  }

  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    const stayTimeline = timelines.find((x) => x.scheduler === "stay");
    if (stayTimeline) {
      const today = format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");
      const stay = await this.stayRepository.findOne({
        where: { stay_from: LessThanOrEqual(today), stay_to: MoreThanOrEqual(today) },
      });

      if (stay) {
        return true;
      }
    }

    return false;
  }
}
