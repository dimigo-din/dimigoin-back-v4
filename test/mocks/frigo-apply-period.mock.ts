import { SetFrigoApplyPeriodDTO } from "../../src/routes/frigo/dto/frigo.manage.dto";

export const FrigoApplyPeriodMock = () => {
  const frigoApplyPeriod = new SetFrigoApplyPeriodDTO();
  frigoApplyPeriod.apply_start_day = 1;
  frigoApplyPeriod.apply_start_hour = 0;
  frigoApplyPeriod.apply_end_day = 2;
  frigoApplyPeriod.apply_end_hour = 22;
  frigoApplyPeriod.grade = 1;

  return frigoApplyPeriod;
};
