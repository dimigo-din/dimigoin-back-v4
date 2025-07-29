import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Gender, Grade, LaundryMachineType, LaundryTimelineTrigger } from "../common/mapper/types";

import { User } from "./user.schema";

@Entity()
export class LaundryTimeline {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true, unique: true })
  triggeredOn: LaundryTimelineTrigger | null;

  @ApiProperty()
  @Column({ type: "boolean", default: false })
  enabled: boolean;

  @ApiProperty({ type: () => [LaundryTime] })
  @OneToMany(() => LaundryTime, (laundryTime) => laundryTime.timeline, { eager: true })
  times: LaundryTime[];

  @ApiProperty({ type: () => LaundryApply })
  @OneToMany(() => LaundryApply, (laundryApply) => laundryApply.laundryTimeline)
  applies: LaundryApply[];
}

// i think better structure exists. but. i'm boring
@Entity()
export class LaundryTime {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  time: string;

  @ApiProperty()
  @Column("int")
  grade: Grade;

  @ApiProperty({ type: () => [LaundryMachine] })
  @ManyToMany(() => LaundryMachine, (laundryMachine) => laundryMachine.laundryTime, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  assigns: LaundryMachine[];

  @ApiProperty({ type: () => LaundryTimeline })
  @ManyToOne(() => LaundryTimeline, (laundryTimeline) => laundryTimeline.times, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  timeline: LaundryTimeline;

  @ApiProperty({ type: () => LaundryApply })
  @OneToMany(() => LaundryApply, (laundryApply) => laundryApply.laundryTime)
  applies: LaundryApply[];
}

// Ahhhhhhhhhhh!!!!! this should be better!!! but.... i have no idea....
// hahaha but i have intellij idea!
@Entity()
export class LaundryMachine {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  type: LaundryMachineType;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty()
  @Column()
  gender: Gender;

  @ApiProperty()
  @Column("boolean")
  enabled: boolean;

  @ApiProperty({ type: () => LaundryApply })
  @OneToMany(() => LaundryApply, (laundryApply) => laundryApply.laundryMachine)
  applies: LaundryApply[];

  @ApiProperty({ type: () => [LaundryTime] })
  @JoinTable()
  @ManyToMany(() => LaundryTime, (laundryTime) => laundryTime.assigns)
  laundryTime: LaundryTime[];
}

@Entity()
export class LaundryApply {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** YYYY-MM-DD */
  @ApiProperty()
  @Column("date")
  date: string;

  @ApiProperty({ type: () => LaundryTimeline })
  @ManyToOne(() => LaundryTimeline, (laundryTimeline) => laundryTimeline.applies, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  laundryTimeline: LaundryTimeline;

  @ApiProperty({ type: () => LaundryTime })
  @ManyToOne(() => LaundryTime, (laundryTime) => laundryTime.applies, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  laundryTime: LaundryTime;

  @ApiProperty({ type: () => LaundryMachine })
  @ManyToOne(() => LaundryMachine, (laundryMachine) => laundryMachine.applies, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  laundryMachine: LaundryMachine;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.laundryApplies, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  user: User;

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;
}
