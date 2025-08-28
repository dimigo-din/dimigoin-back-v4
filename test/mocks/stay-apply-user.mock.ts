import { CreateUserStayApplyDTO, OutingDTO } from "../../src/routes/stay/dto/stay.student.dto";

export const StayApplyMock_User = (stayId: string) => {
  const data = new CreateUserStayApplyDTO();

  const outing = new OutingDTO();
  outing.reason = "자기계발외출";
  outing.breakfast_cancel = false;
  outing.lunch_cancel = true;
  outing.dinner_cancel = false;
  outing.from = "2125-04-07T10:20";
  outing.to = "2125-04-07T14:00";

  data.stay = stayId;
  data.stay_seat = "J10";
  data.outing = [outing];

  return data;
};
