import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import type {
  Gender,
  Grade,
  LaundryMachineType,
  LaundryTimelineSchedule,
} from '../common/mapper/types';

import { User } from './user.schema';

@Entity()
@Index('UQ_laundrytimeline_scheduler_not_etc', ['scheduler'], {
  unique: true,
  // Postgres partial unique index: allow duplicates for 'etc' (and null)
  where: "scheduler IS NOT NULL AND scheduler <> 'etc'",
})
export class LaundryTimeline {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true, default: 'etc' })
  scheduler: LaundryTimelineSchedule | null = 'etc';

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @ApiProperty({ type: () => [LaundryTime] })
  @OneToMany(
    () => LaundryTime,
    (laundryTime) => laundryTime.timeline,
    {
      cascade: ['insert', 'update'],
    },
  )
  times: LaundryTime[];

  @OneToMany(
    () => LaundryApply,
    (laundryApply) => laundryApply.laundryTimeline,
  )
  applies: LaundryApply[];
}

// i think better structure exists. but. i'm boring
@Entity()
export class LaundryTime {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  time: string;

  @ApiProperty({ isArray: true })
  @Column('int', { array: true })
  grade: Grade[];

  @ApiProperty({ type: () => [LaundryMachine] })
  @ManyToMany(
    () => LaundryMachine,
    (laundryMachine) => laundryMachine.laundryTime,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      eager: true,
    },
  )
  assigns: LaundryMachine[];

  @ApiProperty({ type: () => LaundryTimeline })
  @ManyToOne(
    () => LaundryTimeline,
    (laundryTimeline) => laundryTimeline.times,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  timeline: LaundryTimeline;

  @OneToMany(
    () => LaundryApply,
    (laundryApply) => laundryApply.laundryTime,
  )
  applies: LaundryApply[];
}

// Ahhhhhhhhhhh!!!!! this should be better!!! but.... i have no idea....
// hahaha but i have intellij idea!
@Entity()
@Unique(['type', 'name'])
export class LaundryMachine {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  type: LaundryMachineType;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  gender: Gender;

  @ApiProperty()
  @Column('boolean')
  enabled: boolean;

  @OneToMany(
    () => LaundryApply,
    (laundryApply) => laundryApply.laundryMachine,
  )
  applies: LaundryApply[];

  @ApiProperty({ type: () => [LaundryTime] })
  @JoinTable()
  @ManyToMany(
    () => LaundryTime,
    (laundryTime) => laundryTime.assigns,
  )
  laundryTime: LaundryTime[];
}

@Entity()
@Unique(['date', 'laundryTime', 'laundryMachine'])
export class LaundryApply {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** YYYY-MM-DD */
  @ApiProperty()
  @Column('date')
  date: string;

  @ApiProperty({ type: () => LaundryTimeline })
  @ManyToOne(
    () => LaundryTimeline,
    (laundryTimeline) => laundryTimeline.applies,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  laundryTimeline: LaundryTimeline;

  @ApiProperty({ type: () => LaundryTime })
  @ManyToOne(
    () => LaundryTime,
    (laundryTime) => laundryTime.applies,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  laundryTime: LaundryTime;

  @ApiProperty({ type: () => LaundryMachine })
  @ManyToOne(
    () => LaundryMachine,
    (laundryMachine) => laundryMachine.applies,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  laundryMachine: LaundryMachine;

  @ApiProperty({ type: () => User })
  @ManyToOne(
    () => User,
    (user) => user.laundryApplies,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  user: User;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;
}
