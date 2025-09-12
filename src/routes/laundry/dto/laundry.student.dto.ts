import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import { Type } from "class-transformer";

import { Grade, GradeValues } from "../../../common/mapper/types";

export class LaundryApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryApplyDTO {
  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;

  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  machine: string;
}
