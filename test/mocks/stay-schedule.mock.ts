import { Grade } from "../../src/common/mapper/types";
import {
  CreateStayScheduleDTO,
  StayApplyPeriodPerGrade,
} from "../../src/routes/stay/dto/stay.manage.dto";

export const StayScheduleMock = (stayPresetId: string): CreateStayScheduleDTO => {
  const data = new CreateStayScheduleDTO();

  const applyPeriods = [];
  for (let i = 1; i <= 3; i++) {
    const applyPeriod = new StayApplyPeriodPerGrade();
    applyPeriod.grade = i as Grade;
    applyPeriod.apply_start_day = 0;
    applyPeriod.apply_start_hour = 18;
    applyPeriod.apply_end_day = 1;
    applyPeriod.apply_end_hour = 23;

    applyPeriods.push(applyPeriod);
  }

  data.name = "평상시";
  data.stayApplyPeriod = applyPeriods;
  data.stay_from = 5;
  data.stay_to = 6;
  data.outing_day = [6];
  data.staySeatPreset = stayPresetId;

  return data;
};
