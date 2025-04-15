import { CreateStayApplyDTO, OutingDTO } from "../../src/routes/stay/dto/stay.manage.dto";

export const StayApplyMock_Manage = (stayId: string, userId: string) => {
  const data = new CreateStayApplyDTO();

  const outing = new OutingDTO();
  outing.reason = "자기계발외출";
  outing.breakfast_cancel = false;
  outing.lunch_cancel = true;
  outing.dinner_cancel = false;
  outing.from = "2125-04-07T10:20";
  outing.to = "2125-04-07T14:00";
  outing.approved = true;
  outing.audit_reason = "아 그냥 해줘;;";

  data.stay = stayId;
  data.user = userId;
  data.stay_seat = "A1";
  data.outing = [outing];

  return data;
};
