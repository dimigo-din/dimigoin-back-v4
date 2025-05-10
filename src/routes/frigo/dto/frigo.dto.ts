import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

import { FrigoTiming, FrigoTimingValues } from "../../../common/mapper/types";

export class FrigoApplyDTO {
  @ApiProperty()
  @IsIn(FrigoTimingValues)
  timing: FrigoTiming;

  @ApiProperty()
  @IsString()
  reason: string;
}
