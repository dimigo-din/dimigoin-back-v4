import { ApiProperty } from '@nestjs/swagger';
import { IsIn, Matches } from 'class-validator';

import { type Gender, GenderValues } from '../../../common/mapper/types';

export class GetDateSongDTO {
  @ApiProperty({ description: 'YYYY-MM-DD' })
  @Matches(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[01])/)
  date: string;

  @ApiProperty({ enum: GenderValues })
  @IsIn(GenderValues)
  gender: Gender;
}
