import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

import { WakeupSongApplication } from "@/schemas";

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

export class VoteVideoDTO {
  @ApiProperty()
  @IsString()
  songId: string;

  @ApiProperty()
  @IsBoolean()
  upvote: boolean;
}

export class VoteIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class ApplicationsResponseDTO extends WakeupSongApplication {
  @ApiProperty()
  up: number;

  @ApiProperty()
  down: number;
}
