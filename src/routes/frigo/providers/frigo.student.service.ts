import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  format,
  startOfWeek,
  setDay,
  setHours,
  isAfter,
  addWeeks,
  isWithinInterval,
} from "date-fns";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { DayNumber2String } from "../../../common/utils/date.util";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { FrigoApply, FrigoApplyPeriod, User } from "../../../schemas";
import { UserManageService } from "../../user/providers";
import { ClientFrigoApplyDTO } from "../dto/frigo.dto";

@Injectable()
export class FrigoStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FrigoApply)
    private readonly frigoApplyRepository: Repository<FrigoApply>,
    @InjectRepository(FrigoApplyPeriod)
    private readonly frigoApplyPeriodRepository: Repository<FrigoApplyPeriod>,
    private readonly userManageService: UserManageService,
  ) {}

  async getApply(user: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");

    return await this.frigoApplyRepository.findOne({
      where: { user: { id: user.id }, week: week },
    });
  }

  // fuck you consistency
  async frigoApply(user: UserJWT, data: ClientFrigoApplyDTO) {
    // validation
    const period = await safeFindOne<FrigoApplyPeriod>(
      this.frigoApplyPeriodRepository,
      {
        where: { grade: data.grade },
      },
      new HttpException(ErrorMsg.FrigoPeriod_NotExistsForGrade(), HttpStatus.FORBIDDEN),
    );

    if (!(await this.userManageService.checkUserDetail(user.email, { grade: data.grade }))) {
      throw new HttpException(ErrorMsg.FrigoPeriod_NotExistsForGrade(), HttpStatus.FORBIDDEN);
    }

    const now = new Date();
    let start = setHours(setDay(now, period.apply_start_day), period.apply_start_hour);
    const end = setHours(setDay(now, period.apply_end_day), period.apply_end_hour);
    if (isAfter(start, end)) start = addWeeks(start, 1);
    if (!isWithinInterval(now, { start, end }))
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
    const exists = await this.frigoApplyRepository.findOne({
      where: { week: format(startOfWeek(new Date()), "yyyy-MM-dd"), user: dbUser },
    });
    if (exists) throw new HttpException(ErrorMsg.Frigo_AlreadyApplied(), HttpStatus.BAD_REQUEST);

    const apply = new FrigoApply();
    apply.timing = data.timing;
    apply.reason = data.reason;
    apply.week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    apply.user = dbUser;

    return await this.frigoApplyRepository.save(apply);
  }

  async cancelApply(user: UserJWT) {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const apply = await safeFindOne<FrigoApply>(this.frigoApplyRepository, {
      where: { user: { id: user.id }, week: week },
    });

    return await this.frigoApplyRepository.remove(apply);
  }
}
