import { CreateLaundryApplyDTO } from "../../src/routes/laundry/dto/laundry.manage.dto";

export const LaundryApplyMock = (machine: string, time: string, user: string) => {
  const laundryApply = new CreateLaundryApplyDTO();
  laundryApply.machine = machine;
  laundryApply.laundryTime = time;
  laundryApply.user = user;

  return laundryApply;
};
