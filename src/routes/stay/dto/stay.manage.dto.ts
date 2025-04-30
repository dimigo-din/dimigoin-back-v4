import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

import {
  StaySeatTargets,
  StaySeatMappingValues,
  GradeValues,
  Grade,
} from "../../../common/mapper/types";
import { Stay, User } from "../../../schemas";

export class StaySeatPresetIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateStaySeatPresetDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsBoolean()
  only_readingRoom: boolean;

  @ApiProperty()
  @IsArray()
  mappings: CreateStaySeatPresetRangeDTO[];
}

export class UpdateStaySeatPresetDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsBoolean()
  only_readingRoom: boolean;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateStaySeatPresetRangeDTO)
  mappings: CreateStaySeatPresetRangeDTO[];
}

export class CreateStaySeatPresetRangeDTO {
  @ApiProperty()
  @IsIn(StaySeatMappingValues)
  target: StaySeatTargets;

  @ApiProperty()
  @Matches(/^([A-L][1-9]|[A-L]1[0-8]|[M-N][1-7]):([A-L][1-9]|[A-L]1[0-8]|[M-N][1-7])$/, {
    each: true,
  })
  ranges: string[];
}

export class StayScheduleIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateStayScheduleDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => StayApplyPeriodPerGrade)
  stayApplyPeriod: StayApplyPeriodPerGrade[];

  @ApiProperty()
  @IsNumber()
  /** weekday (sunday is 0) */
  stay_from: number;

  @ApiProperty()
  @IsNumber()
  /** weekday (sunday is 0) */
  stay_to: number;

  @ApiProperty()
  @IsNumber({}, { each: true })
  outing_day: number[];

  @ApiProperty()
  @IsString()
  staySeatPreset: string;
}

export class StayApplyPeriodPerGrade {
  @ApiProperty()
  @IsNumber()
  @IsIn(GradeValues)
  grade: Grade;

  @ApiProperty()
  @IsNumber()
  /** start from 0 (sunday) */
  apply_start_day: number;

  @ApiProperty()
  @IsNumber()
  /** 24h */
  apply_start_hour: number;

  @ApiProperty()
  @IsNumber()
  /** start from 0 (sunday) */
  apply_end_day: number;

  @ApiProperty()
  @IsNumber()
  /** 24h */
  apply_end_hour: number;
}

export class UpdateStayScheduleDTO extends CreateStayScheduleDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class StayIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateStayDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  from: string;

  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => StayApplyPeriod_StayDTO)
  period: StayApplyPeriod_StayDTO[];

  @ApiProperty()
  @IsString({ each: true })
  outing_day: string[];

  @ApiProperty()
  @IsString()
  seat_preset: string;
}

export class StayApplyPeriod_StayDTO {
  @ApiProperty()
  @IsIn(GradeValues)
  grade: Grade;

  @ApiProperty()
  @IsString()
  /** YYYY-MM-DDTHH:mm */
  start: string;

  @ApiProperty()
  @IsString()
  /** YYYY-MM-DDTHH:mm */
  end: string;
}

export class UpdateStayDTO extends CreateStayDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class DeleteStayDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class StayApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class OutingDTO {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsBoolean()
  breakfast_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  lunch_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  dinner_cancel: boolean;

  @ApiProperty()
  @IsDateString()
  from: string;

  @ApiProperty()
  @IsDateString()
  to: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  audit_reason?: string;
}

export class CreateStayApplyDTO {
  @ApiProperty()
  @IsString()
  stay: string;

  @ApiProperty()
  @IsString()
  user: string;

  @ApiProperty()
  @IsString()
  stay_seat: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => OutingDTO)
  outing: OutingDTO[];
}

export class UpdateStayApplyDTO extends CreateStayApplyDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class AuditOutingDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  approved: boolean | null;
}

export class UpdateOutingMealCancelDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsBoolean()
  breakfast_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  lunch_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  dinner_cancel: boolean;
}

export class StayApplyListResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: () => Stay })
  stay: Stay;
}
