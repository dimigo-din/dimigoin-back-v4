import { LaundryTimelineScheduler } from "./scheduler.interface";
import { LaundryTimeline, Stay } from "../../../schemas";
import { Injectable } from "@nestjs/common";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class VacationScheduler extends LaundryTimelineScheduler {
  constructor() {
    super();
  }

  async evaluate(timelines: LaundryTimeline[]): Promise<boolean> {
    return false;
  }
}
