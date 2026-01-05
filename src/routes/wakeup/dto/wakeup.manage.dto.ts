import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import type { Gender } from '../../../common/mapper/types';
import { WakeupSongVote } from '../../../schemas';

export class WakeupSongSelectDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class WakeupSongDeleteDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class WakeupSongListResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  video_id: string;

  @ApiProperty()
  video_title: string;

  @ApiProperty()
  video_thumbnail: string;

  /** channel name */
  @ApiProperty()
  video_channel: string;

  /** yyyy-mm-dd (first day of week) */
  @ApiProperty()
  week: string;

  @ApiProperty()
  gender: Gender;

  @ApiProperty({ type: () => WakeupSongVote, isArray: true })
  wakeupSongVote: WakeupSongVote[];
}
