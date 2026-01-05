import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

import type { LaundryApply, StayApply } from "../../../schemas";

export class ApplyResponseDTO {
  @ApiProperty()
  stayApply: StayApply;

  @ApiProperty()
  laundryApply: LaundryApply;
}
export class GetTimelineDTO {
  @ApiProperty()
  @IsIn(["1", "2", "3"])
  grade: number;

  @ApiProperty()
  @IsIn(["1", "2", "3", "4", "5", "6"])
  class: number;
}
