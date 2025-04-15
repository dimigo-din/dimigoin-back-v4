import { CreateStaySeatPresetDTO } from "../../src/routes/stay/dto/stay.manage.dto";

export const StaySeatPresetMock = (): CreateStaySeatPresetDTO => {
  const staySeatPreset = new CreateStaySeatPresetDTO();
  staySeatPreset.name = "평상시";
  staySeatPreset.mappings = [
    {
      target: "3_male",
      ranges: ["A1:K9"],
    },
    {
      target: "3_female",
      ranges: ["A10:A18"],
    },
    {
      target: "2_male",
      ranges: ["J10:K18", "L1:L18", "M1:N7"],
    },
    {
      target: "2_female",
      ranges: ["F10:I18"],
    },
    {
      target: "1_male",
      ranges: ["J10:K18", "L1:L18", "M1:N7"],
    },
    {
      target: "1_female",
      ranges: ["F10:I18"],
    },
  ];

  return staySeatPreset;
};
