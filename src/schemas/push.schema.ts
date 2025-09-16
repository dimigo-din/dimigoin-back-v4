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
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { Gender, Grade, LaundryMachineType, LaundryTimelineTrigger } from "../common/mapper/types";

import { User } from "./user.schema";

@Entity()
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  endpoint: string;

  @Column()
  p256dh: string;

  @Column()
  auth: string;

  @Column({ nullable: true })
  deviceName: string | null;

  @Column({ nullable: true })
  userAgent: string | null;

  // Subscription.expirationTime (ms) or null
  @Column({ type: "int", nullable: true })
  expirationTime: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    onDelete: "CASCADE",
  })
  user: User;
}
