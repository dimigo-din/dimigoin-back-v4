import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SearchVideoDTO {
  @ApiProperty()
  @IsString()
  query: string;
}

export class RegisterVideoDTO {
  @ApiProperty()
  @IsString()
  videoId: string;
}
