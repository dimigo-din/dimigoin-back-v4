import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber } from "class-validator";

export class GetTimelineDTO {
  @ApiProperty()
  @IsIn(["1", "2", "3"])
  grade: number;

  @ApiProperty()
  @IsIn(["1", "2", "3"])
  class: number;
}
