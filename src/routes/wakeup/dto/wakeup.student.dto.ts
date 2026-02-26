import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";
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

export class ApplicationsResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  videoTitle: string;

  @ApiProperty()
  videoThumbnail: string;

  @ApiProperty()
  videoChannel: string;

  @ApiProperty()
  week: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  up: number;

  @ApiProperty()
  down: number;
}
