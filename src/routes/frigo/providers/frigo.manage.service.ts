import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, startOfWeek } from 'date-fns';
import type { Repository } from 'typeorm';

import { safeFindOne } from '../../../common/utils/safeFindOne.util';
import { FrigoApply, FrigoApplyPeriod, User } from '../../../schemas';
import type { UserManageService } from '../../user/providers';
import type {
  AuditFrigoApply,
  FrigoApplyDTO,
  FrigoApplyIdDTO,
  FrigoApplyPeriodIdDTO,
  SetFrigoApplyPeriodDTO,
} from '../dto/frigo.manage.dto';

@Injectable()
export class FrigoManageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FrigoApply)
    private readonly frigoApplyRepository: Repository<FrigoApply>,
    @InjectRepository(FrigoApplyPeriod)
    private readonly frigoApplyPeriodRepository: Repository<FrigoApplyPeriod>,
    readonly _userManageService: UserManageService,
  ) {}

  async getApplyPeriod() {
    return await this.frigoApplyPeriodRepository.find();
  }

  async setApplyPeriod(data: SetFrigoApplyPeriodDTO) {
    const exists = await this.frigoApplyPeriodRepository.findOne({ where: { grade: data.grade } });

    const period = exists || new FrigoApplyPeriod();
    period.apply_start_day = data.apply_start_day;
    period.apply_end_day = data.apply_end_day;
    period.apply_start_hour = data.apply_start_hour;
    period.apply_end_hour = data.apply_end_hour;
    period.grade = data.grade;

    return await this.frigoApplyPeriodRepository.save(period);
  }

  async removeApplyPeriod(data: FrigoApplyPeriodIdDTO) {
    const period = await safeFindOne<FrigoApplyPeriod>(this.frigoApplyPeriodRepository, data.id);

    return await this.frigoApplyPeriodRepository.remove(period);
  }

  async getApplyList() {
    const week = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    return await this.frigoApplyRepository.find({ where: { week: week } });
  }

  // considering: separate update and apply
  async apply(data: FrigoApplyDTO) {
    const user = await safeFindOne<User>(this.userRepository, data.user);

    const week = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const exists = await this.frigoApplyRepository.findOne({
      where: { week: week, user: { id: user.id } },
    });

    const apply = exists || new FrigoApply();
    apply.timing = data.timing;
    apply.reason = data.reason;
    apply.week = week;
    apply.user = user;
    apply.approved = true;

    return await this.frigoApplyRepository.save(apply);
  }

  async removeApply(data: FrigoApplyIdDTO) {
    const apply = await safeFindOne<FrigoApply>(this.frigoApplyRepository, data.id);

    return await this.frigoApplyRepository.remove(apply);
  }

  async auditApply(data: AuditFrigoApply) {
    const apply = await safeFindOne<FrigoApply>(this.frigoApplyRepository, data.id);

    apply.audit_reason = data.audit_reason;
    apply.approved = data.approved;

    return await this.frigoApplyRepository.save(apply);
  }
}
