import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional, IsString, ValidateNested } from "class-validator";

import { CreateStayDTO } from "./stay.manage.dto";

export class StayIdDTO {
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

  @ApiProperty({ type: () => OutingDTO, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => OutingDTO)
  outing: OutingDTO[];
}
