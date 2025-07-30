import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber } from "class-validator";

import { LaundryApply, StayApply } from "../../../schemas";

export class GetTimelineDTO {
  @ApiProperty()
  @IsIn(["1", "2", "3"])
  grade: number;

  @ApiProperty()
  @IsIn(["1", "2", "3", "4", "5", "6"])
  class: number;
}

export class ApplyResponseDTO {
  @ApiProperty()
  stayApply: StayApply;

  @ApiProperty()
  laundryApply: LaundryApply;
}
