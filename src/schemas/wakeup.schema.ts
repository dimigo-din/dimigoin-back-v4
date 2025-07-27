import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user.schema";

@Entity()
@Index(["video_id", "week"], { unique: true })
export class WakeupSongApplication {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
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

  @OneToMany(() => WakeupSongVote, (wakeupSongVote) => wakeupSongVote.wakeupSongApplication)
  wakeupSongVote: WakeupSongVote[];

  @ManyToOne(() => User, (user) => user.wakeupSongApplication)
  user: User;
}

@Entity()
@Index(["user", "wakeupSongApplication"], { unique: true })
export class WakeupSongVote {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column("boolean")
  upvote: boolean;

  @ApiProperty()
  @ManyToOne(
    () => WakeupSongApplication,
    (wakeupSongApplication) => wakeupSongApplication.wakeupSongVote,
  )
  wakeupSongApplication: WakeupSongApplication;

  @ManyToOne(() => User, (user) => user.wakeupSongVote)
  user: User;
}

@Entity()
export class WakeupSongHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  video_id: string;

  /** yyyy-mm-dd */
  @ApiProperty()
  @Column("date")
  date: string;
}
