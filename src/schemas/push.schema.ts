import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { PushTokenType } from "../common/mapper/types";

import { User } from "./user.schema";

@Entity()
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  p256dh: string;

  @Column({ nullable: true })
  auth: string;

  @Column({ nullable: true })
  fcmToken: string | null;

  @Column()
  tokenType: PushTokenType;

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
