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
  type PushNotificationSubjectIdentifier,
  PushNotificationSubjectIdentifierValues,
} from "$mapper/types";
import type { User } from "./user.schema";
import { User as UserEntity } from "./user.schema";

@Entity()
export class PushSubscription {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** fcm token */
  @ApiProperty()
  @Column()
  token: string;

  @ApiProperty()
  @Column({ nullable: true })
  deviceId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => PushSubject,
    (pushSubject) => pushSubject.subscription,
    {
      cascade: ["insert", "update", "remove"],
    },
  )
  subjects: PushSubject[];

  @ManyToOne(
    () => UserEntity,
    (user) => user.pushSubscriptions,
    {
      onDelete: "CASCADE",
    },
  )
  user: User;
}

@Entity()
export class PushSubject {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** eng identifier for code. */
  @ApiProperty({ enum: PushNotificationSubjectIdentifierValues })
  @Column({ type: "enum", enum: PushNotificationSubjectIdentifierValues })
  identifier: PushNotificationSubjectIdentifier;

  /** kor name for users */
  @ApiProperty()
  @Column()
  name: string;

  @ManyToOne(
    () => PushSubscription,
    (subscription) => subscription.subjects,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  subscription: PushSubscription;

  @ManyToOne(
    () => UserEntity,
    (user) => user.pushSubject,
    {
      onDelete: "CASCADE",
    },
  )
  user: User;
}
