import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";

export class GetDateSongDTO {
  @ApiProperty({ description: "YYYY-MM-DD" })
  @Matches(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[01])/)
  date: string;
}
