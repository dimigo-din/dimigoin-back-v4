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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
  onDelete: 'CASCADE',
  })
  user: User;
  
  @Column({ type: 'text', nullable: true })
  deviceName: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  // Subscription.expirationTime (ms) or null
  @Column({ type: 'bigint', nullable: true })
  expirationTime: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
