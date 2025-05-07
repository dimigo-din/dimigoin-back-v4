import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNumber, IsString, Max, Min } from "class-validator";

import { FrigoTiming, FrigoTimingValues, Grade, GradeValues } from "../../../common/mapper/types";

export class FrigoApplyPeriodIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class SetFrigoApplyPeriodDTO {
  @ApiProperty()
  @Min(0)
  @Max(6)
  @IsNumber()
  apply_start_day: number;

  @ApiProperty()
  @Min(0)
  @Max(6)
  @IsNumber()
  apply_end_day: number;

  @ApiProperty()
  @Min(0)
  @Max(24)
  @IsNumber()
  apply_start_hour: number;

  @ApiProperty()
  @Min(0)
  @Max(24)
  @IsNumber()
  apply_end_hour: number;

  @ApiProperty()
  @IsIn(GradeValues)
  grade: Grade;
}

export class FrigoApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class FrigoApplyDTO {
  @ApiProperty()
  @IsIn(FrigoTimingValues)
  timing: FrigoTiming;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsString()
  user: string;
}

export class AuditFrigoApply {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ nullable: true })
  @Optional()
  @IsString()
  audit_reason?: string;

  @ApiProperty({ nullable: true })
  @Optional()
  @IsBoolean()
  approved?: boolean;
}
