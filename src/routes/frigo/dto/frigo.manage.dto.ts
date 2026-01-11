import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

import {
  type FrigoTiming,
  FrigoTimingValues,
  type Grade,
  GradeValues,
} from "@/common/mapper/types";

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
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}

export class FrigoApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class FrigoApplyDTO {
  @ApiProperty({ enum: FrigoTimingValues })
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
  @IsOptional()
  @IsString()
  audit_reason?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}
