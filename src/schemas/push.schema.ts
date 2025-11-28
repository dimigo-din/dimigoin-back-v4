import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  PushNotificationSubjectIdentifier,
  PushNotificationSubjectIdentifierValues,
} from "../common/mapper/types";

import { User } from "./user.schema";

@Entity()
export class PushSubscription {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** fcm token */
  @ApiProperty()
  @Column()
  token: string | null;

  @ApiProperty()
  @Column({ nullable: true })
  deviceId: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PushSubject, (pushSubject) => pushSubject.subscription, {
    cascade: ["insert", "update", "remove"],
    eager: true,
  })
  subject: PushSubject[];

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    onDelete: "CASCADE",
  })
  user: User;
}

@Entity()
export class PushSubject {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** eng identifier for code. */
  @ApiProperty({ enum: PushNotificationSubjectIdentifierValues })
  @Column()
  identifier: PushNotificationSubjectIdentifier;

  /** kor name for users */
  @ApiProperty()
  @Column()
  name: string;

  @ManyToOne(() => PushSubscription, (subscription) => subscription.subject, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  subscription: PushSubscription;

  @ManyToOne(() => User, (user) => user.pushSubject, {
    onDelete: "CASCADE",
  })
  user: User;
}
