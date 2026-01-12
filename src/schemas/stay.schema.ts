import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { type Grade, StaySeatMappingValues, type StaySeatTargets } from "$mapper/types";
import type { User } from "./user.schema";
import { User as UserEntity } from "./user.schema";

// I think my schema naming is like shit.
// someone who have better idea, plz improve these shits

@Entity()
export class StaySeatPreset {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column("boolean")
  only_readingRoom: boolean;

  @ApiProperty({ type: () => [StaySeatPresetRange] })
  @OneToMany(
    () => StaySeatPresetRange,
    (staySeat) => staySeat.stay_seat_preset,
    { eager: true },
  )
  stay_seat: StaySeatPresetRange[];

  @OneToMany(
    () => StaySchedule,
    (staySchedule) => staySchedule.stay_seat_preset,
  )
  stay_schedule: StaySchedule[];
}

@Entity()
export class StaySeatPresetRange {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column({ type: "enum", enum: StaySeatMappingValues })
  target: StaySeatTargets;

  @ApiProperty()
  @Column()
  range: string;

  @ManyToOne(
    () => StaySeatPreset,
    (staySeatPreset) => staySeatPreset.stay_seat,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  stay_seat_preset: StaySeatPreset;
}

// this is just like preset
// available: only certain grade can stay
@Entity() // generating "Stay" periodically by cron
export class StaySchedule {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** key */
  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty({ type: () => [StayApplyPeriod_StaySchedule] })
  @OneToMany(
    () => StayApplyPeriod_StaySchedule,
    (stayApplyPeriod_StaySchedule) => stayApplyPeriod_StaySchedule.stay_schedule,
    {
      eager: true,
      cascade: ["insert", "update"],
    },
  )
  stay_apply_period: StayApplyPeriod_StaySchedule[];

  /** weekday (sunday is 0) */
  @ApiProperty({ description: "weekday (sunday is 0)" })
  @Column()
  stay_from: number;

  /** weekday (sunday is 0) */
  @ApiProperty({ description: "weekday (sunday is 0)" })
  @Column()
  stay_to: number;

  /** ex) 0,1,2 <= sunday, monday, tuesday */
  @ApiProperty({ description: "ex) 0,1,2 <= sunday, monday, tuesday" })
  @Column("int", { array: true })
  outing_day: number[];

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @ApiProperty({ type: () => StaySeatPreset })
  @ManyToOne(
    () => StaySeatPreset,
    (staySeatPreset) => staySeatPreset.stay_schedule,
    {
      eager: true,
    },
  )
  stay_seat_preset: StaySeatPreset;

  @ApiProperty({ type: () => [Stay] })
  @OneToMany(
    () => Stay,
    (stay) => stay.parent,
    {
      cascade: ["insert", "update"],
    },
  )
  children: Stay[];
}

@Entity()
@Index(["stay_from", "stay_to"])
@Unique(["name", "stay_from", "stay_to"])
export class Stay {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  /** YYYY-MM-DD */
  @ApiProperty()
  @Column("date")
  stay_from: string;

  /** YYYY-MM-DD */
  @ApiProperty()
  @Column("date")
  stay_to: string;

  /** ex) YYYY-MM-DD */
  @ApiProperty()
  @Column("text", { array: true })
  outing_day: string[];

  @ApiProperty({ type: () => [StayApplyPeriod_Stay] })
  @OneToMany(
    () => StayApplyPeriod_Stay,
    (stayApplyPeriod_Stay) => stayApplyPeriod_Stay.stay,
    {
      cascade: ["insert", "update"],
      eager: true,
    },
  )
  stay_apply_period: StayApplyPeriod_Stay[];

  /** if null, stay in class or something else */
  @ApiProperty({ type: () => StaySeatPreset })
  @ManyToOne(
    () => StaySeatPreset,
    (staySeatPreset) => staySeatPreset.stay_schedule,
    {
      eager: true,
      onUpdate: "CASCADE",
      nullable: true,
    },
  )
  stay_seat_preset: StaySeatPreset;

  // @ApiProperty({ type: () => StayApply })
  @OneToMany(
    () => StayApply,
    (stay_apply) => stay_apply.stay,
    {
      cascade: ["soft-remove", "recover"],
    },
  )
  stay_apply: StayApply[];

  // @ApiProperty({ type: () => StaySchedule, nullable: true })
  @ManyToOne(
    () => StaySchedule,
    (schedule) => schedule.children,
    { nullable: true },
  )
  parent: StaySchedule;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}

@Entity()
export class StayApplyPeriod_StaySchedule {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column("int")
  grade: Grade;

  /** weekday (sunday is 0) */
  @ApiProperty()
  @Column("int")
  apply_start_day: number;

  /** 24h */
  @ApiProperty()
  @Column("int")
  apply_start_hour: number;

  /** weekday (sunday is 0) */
  @ApiProperty()
  @Column("int")
  apply_end_day: number;

  /** 24h */
  @ApiProperty()
  @Column("int")
  apply_end_hour: number;

  @ManyToOne(
    () => StaySchedule,
    (staySchedule) => staySchedule.stay_apply_period,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  stay_schedule: StaySchedule;
}
@Entity()
@Unique(["stay", "grade"])
export class StayApplyPeriod_Stay {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column("int")
  grade: Grade;

  /** YYYY-MM-DDTHH:mm */
  @ApiProperty()
  @Column("timestamptz")
  apply_start: Date;

  /** YYYY-MM-DDTHH:mm */
  @ApiProperty()
  @Column("timestamptz")
  apply_end: Date;

  @ManyToOne(
    () => Stay,
    (stay) => stay.stay_apply_period,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      nullable: true,
    },
  )
  stay: Stay;
}

@Entity()
@Unique(["stay", "user"])
export class StayApply {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  stay_seat: string;

  @ManyToOne(
    () => Stay,
    (stay) => stay.stay_apply,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  stay: Stay;

  @ApiProperty({ type: () => StayOuting, isArray: true })
  @OneToMany(
    () => StayOuting,
    (stayOuting) => stayOuting.stay_apply,
    {
      cascade: ["insert", "update", "soft-remove", "recover"],
      eager: true,
    },
  )
  outing: StayOuting[];

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(
    () => UserEntity,
    (user) => user.stay_apply,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      eager: true,
    },
  )
  user: User;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}

@Entity()
export class StayOuting {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  reason: string;

  @ApiProperty()
  @Column("boolean")
  breakfast_cancel: boolean;

  @ApiProperty()
  @Column("boolean")
  lunch_cancel: boolean;

  @ApiProperty()
  @Column("boolean")
  dinner_cancel: boolean;

  /** YYYY-MM-DDTHH:mm */
  @ApiProperty()
  @Column()
  from: string;

  /** YYYY-MM-DDTHH:mm */
  @ApiProperty()
  @Column()
  to: string;

  @ApiProperty({ nullable: true })
  @Column("boolean", { nullable: true })
  approved: boolean | null;

  @ApiProperty({ nullable: true })
  @Column("varchar", { nullable: true })
  audit_reason: string | null;

  @ManyToOne(
    () => StayApply,
    (stayApply) => stayApply.outing,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  stay_apply: StayApply;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
