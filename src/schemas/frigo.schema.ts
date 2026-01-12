import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { type FrigoTiming, FrigoTimingValues, type Grade } from "$mapper/types";
import type { User } from "./user.schema";
import { User as UserEntity } from "./user.schema";

// frigo is fixed
@Entity()
export class FrigoApplyPeriod {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** weekday (sunday is 0) */
  @ApiProperty()
  @Column("int")
  apply_start_day: number;

  /** weekday (sunday is 0) */
  @ApiProperty()
  @Column("int")
  apply_end_day: number;

  /** 24h */
  @ApiProperty()
  @Column("int")
  apply_start_hour: number;

  /** 24h */
  @ApiProperty()
  @Column("int")
  apply_end_hour: number;

  @ApiProperty()
  @Column({ type: "int", unique: true })
  grade: Grade;
}

@Entity()
@Index(["week", "user"])
export class FrigoApply {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** sunday of week */
  @ApiProperty()
  @Column()
  week: string;

  @ApiProperty()
  @Column({ type: "enum", enum: FrigoTimingValues })
  timing: FrigoTiming;

  @ApiProperty()
  @Column({ nullable: true })
  reason: string;

  @ApiProperty()
  @Column({ nullable: true })
  audit_reason?: string;

  @ApiProperty({ nullable: true })
  @Column({ type: "bool", nullable: true })
  approved?: boolean;

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(
    () => UserEntity,
    (user) => user.frigo,
    { eager: true },
  )
  user: User;
}
