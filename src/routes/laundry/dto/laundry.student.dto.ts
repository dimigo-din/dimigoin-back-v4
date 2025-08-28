import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LaundryApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LaundryApplyDTO {
  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  machine: string;
}
