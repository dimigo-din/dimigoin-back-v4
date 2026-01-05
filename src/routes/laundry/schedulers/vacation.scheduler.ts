import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { LaundryTimeline, Stay } from "../../../schemas";
import { LaundryTimelineScheduler } from "./scheduler.interface";

@Injectable()
export class VacationScheduler extends LaundryTimelineScheduler {
  constructor() {
    super();
  }

  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    return false;
  }
}
