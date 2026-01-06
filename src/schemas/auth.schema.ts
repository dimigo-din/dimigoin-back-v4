import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { LoginType, LoginTypeValues } from "../common/mapper/types";

import { User } from "./user.schema";

@Entity()
export class Login {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(
    () => User,
    (user) => user.login,
    {
      cascade: ["insert", "update"],
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      eager: true,
    },
  )
  user: User;

  @ApiProperty()
  @Column({ enum: LoginTypeValues })
  type: LoginType;

  @ApiProperty()
  @Column("text")
  identifier1: string;

  @ApiProperty()
  @Column("text", { nullable: true })
  identifier2: string | null = null;
}

@Entity()
export class Session {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  refreshToken: string;

  @ApiProperty()
  @Column()
  sessionIdentifier: string;

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updated_at: Date;

  @ApiProperty({ type: () => User })
  @ManyToOne(
    () => User,
    (user) => user.session,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      eager: true,
    },
  )
  user: User;
}
