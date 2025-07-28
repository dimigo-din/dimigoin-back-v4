import { ClientFrigoApplyDTO } from "../../src/routes/frigo/dto/frigo.dto";

export const FrigoApplyMock = () => {
  const apply = new ClientFrigoApplyDTO();
  apply.reason = "아니 십팔 집에가고싶다고.";
  apply.timing = "after_2nd_study";

  return apply;
};
