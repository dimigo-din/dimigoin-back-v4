import { LaundryTimelineScheduler } from "./scheduler.interface";
import { LaundryTimeline, Stay } from "../../../schemas";
import { Injectable } from "@nestjs/common";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import * as moment from "moment";

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
      const today = moment().tz("Asia/Seoul").format("YYYY-MM-DD");
      const stay = await this.stayRepository.findOne({
        where: { stay_from: LessThanOrEqual(today), stay_to: MoreThanOrEqual(today) },
      });

      if (stay) {
        return true
      }
    }

    return false;
  }
}