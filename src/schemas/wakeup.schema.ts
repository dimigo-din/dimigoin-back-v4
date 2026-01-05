import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Gender } from '../common/mapper/types';

import { User } from './user.schema';

@Entity()
@Index(['video_id', 'week'], { unique: true })
@Index(['week', 'gender'])
export class WakeupSongApplication {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  video_id: string;

  @ApiProperty()
  @Column()
  video_title: string;

  @ApiProperty()
  @Column()
  video_thumbnail: string;

  /** channel name */
  @ApiProperty()
  @Column()
  video_channel: string;

  /** yyyy-mm-dd (first day of week) */
  @ApiProperty()
  @Column()
  week: string;

  @ApiProperty()
  @Column()
  gender: Gender;

  @OneToMany(
    () => WakeupSongVote,
    (wakeupSongVote) => wakeupSongVote.wakeupSongApplication,
    {
      cascade: ['soft-remove', 'recover'],
    },
  )
  wakeupSongVote: WakeupSongVote[];

  @ManyToOne(
    () => User,
    (user) => user.wakeupSongApplication,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  user: User;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}

@Entity()
@Index(['user', 'wakeupSongApplication'], { unique: true })
@Index(['wakeupSongApplication', 'upvote'])
export class WakeupSongVote {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('boolean')
  upvote: boolean;

  @ApiProperty()
  @ManyToOne(
    () => WakeupSongApplication,
    (wakeupSongApplication) => wakeupSongApplication.wakeupSongVote,
    { onUpdate: 'CASCADE', onDelete: 'CASCADE' },
  )
  wakeupSongApplication: WakeupSongApplication;

  @ManyToOne(
    () => User,
    (user) => user.wakeupSongVote,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  user: User;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}

@Entity()
export class WakeupSongHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  video_id: string;

  @ApiProperty()
  @Column()
  video_title: string;

  /** yyyy-mm-dd */
  @ApiProperty()
  @Column('date')
  date: string;

  @ApiProperty()
  @Column()
  gender: Gender;

  @ApiProperty()
  @Column('int')
  up: number;

  @ApiProperty()
  @Column('int')
  down: number;
}
