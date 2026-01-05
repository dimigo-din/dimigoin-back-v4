import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsString, ValidateNested } from 'class-validator';

import { type Gender, GenderValues, type Grade, GradeValues } from '../../../common/mapper/types';

export class StayIdDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
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
}

export class StayApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateUserStayApplyDTO {
  @ApiProperty()
  @IsString()
  stay: string;

  @ApiProperty()
  @IsString()
  stay_seat: string;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;

  @ApiProperty()
  @IsIn(GenderValues)
  gender: Gender;

  @ApiProperty({ type: () => OutingDTO, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => OutingDTO)
  outing: OutingDTO[];
}

export class AddStayOutingDTO {
  @ApiProperty()
  @IsString()
  apply_id: string;

  @ApiProperty({ type: () => OutingDTO })
  @ValidateNested()
  @Type(() => OutingDTO)
  outing: OutingDTO;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}

export class EditStayOutingDTO {
  @ApiProperty()
  @IsString()
  outing_id: string;

  @ApiProperty({ type: () => OutingDTO })
  @ValidateNested()
  @Type(() => OutingDTO)
  outing: OutingDTO;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}

export class StayOutingIdDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}

export class GetStayListDTO {
  @ApiProperty()
  @Type(() => Number)
  @IsIn(GradeValues)
  grade: Grade;
}
