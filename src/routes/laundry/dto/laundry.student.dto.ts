import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

import { Grade, GradeValues } from "../../../common/mapper/types";

export class LaundryApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryApplyDTO {
  @ApiProperty()
  @IsIn(GradeValues)
  grade: Grade;

  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  machine: string;
}
