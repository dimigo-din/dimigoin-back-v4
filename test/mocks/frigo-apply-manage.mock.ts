import { FrigoApplyDTO } from "../../src/routes/frigo/dto/frigo.manage.dto";

export const FrigoApplyManageMock = (user: string) => {
  const frigoApply = new FrigoApplyDTO();
  frigoApply.timing = "afterschool";
  frigoApply.reason = "집에가고싶어서";
  frigoApply.user = user;

  return frigoApply;
};
