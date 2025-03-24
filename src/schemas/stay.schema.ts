import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
} from "typeorm";

import { Grade, StaySeatTargets } from "../common/mapper/types";

import { User } from "./user.schema";

// I think my schema naming is like shit.
// someone who have better idea, plz improve these shits

@Entity()
export class StaySeatPreset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @JoinColumn()
  @OneToMany(() => StaySeatPresetRange, (staySeat) => staySeat.stay_seat_preset, { eager: true })
  stay_seat: StaySeatPresetRange[];

  @OneToMany(() => StaySchedule, (staySchedule) => staySchedule.stay_seat_preset)
  stay_schedule: StaySchedule[];
}

@Entity()
export class StaySeatPresetRange {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  target: StaySeatTargets;

  @Column()
  range: string;

  @ManyToOne(() => StaySeatPreset, (staySeatPreset) => staySeatPreset.stay_seat, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  stay_seat_preset: StaySeatPreset;
}

// this is just like preset
// available: only certain grade can stay
@Entity() // generating "Stay" periodically by cron
export class StaySchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** key */
  @Column()
  name: string;

  @JoinColumn()
  @OneToOne(
    () => StayApplyPeriod_StaySchedule,
    (stayApplyPeriod_StaySchedule) => stayApplyPeriod_StaySchedule.stay_schedule,
    {
      eager: true,
    },
  )
  stay_apply_period: StayApplyPeriod_StaySchedule[];

  /** weekday (sunday is 0) */
  @Column()
  stay_from: number;

  /** weekday (sunday is 0) */
  @Column()
  stay_to: number;

  /** ex) 0,1,2 <= sunday, monday, tuesday */
  @Column()
  outing_day: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @JoinColumn()
  @ManyToOne(() => StaySeatPreset, (staySeatPreset) => staySeatPreset.stay_schedule, {
    eager: true,
    onUpdate: "CASCADE",
  })
  stay_seat_preset: StaySeatPreset;
}

@Entity()
export class Stay {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  /** YYYY-MM-DD */
  @Column()
  stay_from: string;

  /** YYYY-MM-DD */
  @Column()
  stay_to: string;

  @JoinColumn()
  @OneToOne(() => StayApplyPeriod_Stay, (stayApplyPeriod_Stay) => stayApplyPeriod_Stay.stay, {
    eager: true,
  })
  stay_apply_period: StayApplyPeriod_Stay[];

  /** if null, stay in class */
  @JoinColumn()
  @ManyToOne(() => StaySeatPreset, (staySeatPreset) => staySeatPreset.stay_schedule, {
    eager: true,
    onUpdate: "CASCADE",
  })
  stay_seat_preset: StaySeatPreset;
}

@Entity()
export class StayApplyPeriod_StaySchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("int")
  grade: Grade;

  /** weekday (sunday is 0) */
  @Column("int")
  apply_start_day: number;

  /** 24h */
  @Column("int")
  apply_start_hour: number;

  /** weekday (sunday is 0) */
  @Column("int")
  apply_end_day: number;

  /** 24h */
  @Column("int")
  apply_end_hour: number;

  @OneToOne(() => StaySchedule, (staySchedule) => staySchedule.stay_apply_period, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true,
  })
  stay_schedule: StaySchedule;
}
@Entity()
export class StayApplyPeriod_Stay {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("int")
  grade: Grade;

  /** YYYY-MM-DD HH:mm */
  @Column()
  apply_start: string;

  /** YYYY-MM-DD HH:mm */
  @Column()
  apply_end: string;

  @OneToOne(() => Stay, (stay) => stay.stay_apply_period, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true,
  })
  stay: Stay;
}

@Entity()
export class StayApply {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  stay_seat: string;

  @JoinColumn()
  @OneToMany(() => StayOuting, (stayOuting) => stayOuting.stay_apply, {
    eager: true,
  })
  outing: StayOuting[];

  @ManyToOne(() => User, (user) => user.stay_apply, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  user: User;
}

@Entity()
export class StayOuting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  reason: string;

  @Column("boolean")
  breakfast_cancel: boolean;

  @Column("boolean")
  lunch_cancel: boolean;

  @Column("boolean")
  dinner_cancel: boolean;

  /** YYYY-MM-DD HH:mm */
  @Column()
  from: string;

  /** YYYY-MM-DD HH:mm */
  @Column()
  to: string;

  @Column()
  is_self_enlightenment: boolean;

  @Column("boolean", { nullable: true })
  approved: boolean;

  @Column("varchar", { nullable: true })
  audit_reason: string;

  @ManyToOne(() => StayApply, (stayApply) => stayApply.outing, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  stay_apply: StayApply;
}
