import { SetFrigoApplyPeriodDTO } from "../../src/routes/frigo/dto/frigo.manage.dto";

export const FrigoApplyPeriodMock = () => {
  const frigoApplyPeriod = new SetFrigoApplyPeriodDTO();
  frigoApplyPeriod.apply_start_day = 0;
  frigoApplyPeriod.apply_start_hour = 0;
  frigoApplyPeriod.apply_end_day = 6;
  frigoApplyPeriod.apply_end_hour = 24;
  frigoApplyPeriod.grade = 1;

  return frigoApplyPeriod;
};
