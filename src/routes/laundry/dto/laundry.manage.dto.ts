import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsString, Matches, ValidateNested } from 'class-validator';

import {
  type Gender,
  GenderValues,
  type Grade,
  GradeValues,
  type LaundryMachineType,
  LaundryMachineTypeValues,
  type LaundryTimelineSchedule,
  LaundryTimelineSchedulerValues,
} from '../../../common/mapper/types';

export class LaundryTimelineIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryTimeDTO {
  @ApiProperty()
  @Matches(/^((1[0-9])|(2[0-3])|(0[0-9])):([0-5][0-9])$/)
  time: string;

  @ApiProperty({ isArray: true })
  @IsIn(GradeValues, { each: true })
  grade: Grade[];

  @ApiProperty()
  @IsString({ each: true })
  assigns: string[];
}

export class CreateLaundryTimelineDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsIn(LaundryTimelineSchedulerValues)
  scheduler: LaundryTimelineSchedule;

  @ApiProperty({ type: [LaundryTimeDTO] })
  @ValidateNested({ each: true })
  @Type(() => LaundryTimeDTO)
  times: LaundryTimeDTO[];
}

export class UpdateLaundryTimelineDTO extends CreateLaundryTimelineDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryMachineIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateLaundryMachineDTO {
  @ApiProperty()
  @IsIn(LaundryMachineTypeValues)
  type: LaundryMachineType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsIn(GenderValues)
  gender: Gender;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateLaundryMachineDTO extends CreateLaundryMachineDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateLaundryApplyDTO {
  /** LaundryTime */
  @ApiProperty()
  @IsString()
  laundryTime: string;

  /** LaundryMachine id */
  @ApiProperty()
  @IsString()
  machine: string;

  /** User id */
  @ApiProperty()
  @IsString()
  user: string;
}

// only update user
export class UpdateLaundryApplyDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  user: string;
}

export class LaundryTimelineListResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  enabled: boolean;
}
