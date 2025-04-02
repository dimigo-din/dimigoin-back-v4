import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsNumber, IsString, Matches } from "class-validator";

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
  @IsArray()
  mappings: CreateStaySeatPresetRangeDTO[];
}

export class UpdateStaySeatPresetDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsArray()
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
  @IsArray()
  stayApplyPeriod: StayApplyPeriodPerGrade[];

  @ApiProperty()
  @IsNumber()
  stay_from: number;

  @ApiProperty()
  @IsNumber()
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
  apply_start_day: number;

  @ApiProperty()
  @IsNumber()
  apply_start_hour: number;

  @ApiProperty()
  @IsNumber()
  apply_end_day: number;

  @ApiProperty()
  @IsNumber()
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
  period: StayApplyPeriod_StayDTO[];

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
  start: string;

  @ApiProperty()
  @IsString()
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
}

export class UpdateStayApplyDTO extends CreateStayApplyDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class StayApplyListResponseDTO {
  id: string;
  user: User;
  stay: Stay;
}
