import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsString } from "class-validator";

import {
  type FrigoTiming,
  FrigoTimingValues,
  type Grade,
  GradeValues,
} from "../../../common/mapper/types";

export class ClientFrigoApplyDTO {
  @ApiProperty()
  @IsIn(FrigoTimingValues)
  timing: FrigoTiming;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}
