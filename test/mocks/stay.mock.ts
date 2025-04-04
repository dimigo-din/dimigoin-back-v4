import { Grade } from "../../src/common/mapper/types";
import { CreateStayDTO, StayApplyPeriod_StayDTO } from "../../src/routes/stay/dto/stay.manage.dto";

export const StayMock = (preset: string): CreateStayDTO => {
  const data = new CreateStayDTO();

  const periods = [];
  for (let i = 1; i <= 3; i++) {
    const applyPeriod = new StayApplyPeriod_StayDTO();
    applyPeriod.grade = i as Grade;
    applyPeriod.start = "2125-04-03T18:00";
    applyPeriod.end = "2125-04-04T23:00";

    periods.push(applyPeriod);
  }

  data.name = "평상시";
  data.from = "2125-04-06";
  data.to = "2125-04-07";
  data.period = periods;
  data.outing_day = ["2125-04-07"];
  data.seat_preset = preset;

  return data;
};
