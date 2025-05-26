import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { DayNumber2String } from "../../../common/utils/date.util";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { FrigoApply, FrigoApplyPeriod, User } from "../../../schemas";
import { FrigoApplyDTO } from "../dto/frigo.dto";

@Injectable()
export class FrigoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FrigoApply)
    private readonly frigoApplyRepository: Repository<FrigoApply>,
    @InjectRepository(FrigoApplyPeriod)
    private readonly frigoApplyPeriodRepository: Repository<FrigoApplyPeriod>,
  ) {}

  async getApply(user: UserJWT) {
    const week = moment().startOf("week").format("YYYY-MM-DD");

    return await this.frigoApplyRepository.findOne({
      where: { user: { id: user.id }, week: week },
    });
  }

  // fuck you consistency
  async frigoApply(user: UserJWT, data: FrigoApplyDTO) {
    // validation
    const period = await safeFindOne<FrigoApplyPeriod>(
      this.frigoApplyPeriodRepository,
      {
        where: { grade: user.grade },
      },
      new HttpException(ErrorMsg.FrigoPeriod_NotExistsForGrade(), HttpStatus.FORBIDDEN),
    );

    const now = moment();
    const start = moment().day(period.apply_start_day).hour(period.apply_start_hour);
    const end = moment().day(period.apply_end_day).hour(period.apply_end_hour);
    if (start.isAfter(end)) start.add("1", "week");
    if (!now.isBetween(start, end))
      throw new HttpException(
        ErrorMsg.FrigoPeriod_NotInApplyPeriod(
          DayNumber2String(period.apply_start_day),
          period.apply_start_hour,
          DayNumber2String(period.apply_end_day),
          period.apply_end_hour,
        ),
        HttpStatus.BAD_REQUEST,
      );

    // apply
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    const apply = new FrigoApply();
    apply.timing = data.timing;
    apply.reason = data.reason;
    apply.week = moment().startOf("week").format("YYYY-MM-DD");
    apply.user = dbUser;

    return await this.frigoApplyRepository.save(apply);
  }

  async cacelApply(user: UserJWT) {
    const week = moment().startOf("week").format("YYYY-MM-DD");
    const apply = await safeFindOne<FrigoApply>(this.frigoApplyRepository, {
      where: { user: { id: user.id }, week: week },
    });

    return await this.frigoApplyRepository.remove(apply);
  }
}
