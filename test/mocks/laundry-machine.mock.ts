import { CreateLaundryMachineDTO } from "../../src/routes/laundry/dto/laundry.manage.dto";

export const LaundryMachineMock = () => {
  const laundryMachine = new CreateLaundryMachineDTO();
  laundryMachine.name = "학봉관 1층 우측";
  laundryMachine.gender = "male";
  laundryMachine.type = "washer";
  laundryMachine.enabled = true;

  return laundryMachine;
};
