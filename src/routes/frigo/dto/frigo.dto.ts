import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, IsString } from "class-validator";

import { FrigoTiming, FrigoTimingValues, Grade, GradeValues } from "../../../common/mapper/types";

export class ClientFrigoApplyDTO {
  @ApiProperty()
  @IsIn(FrigoTimingValues)
  timing: FrigoTiming;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsIn(GradeValues)
  grade: Grade;
}
