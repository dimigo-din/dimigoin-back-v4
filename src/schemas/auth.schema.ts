import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
  @ManyToOne(() => User, (user) => user.login, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;

  @ApiProperty()
  @Column({ enum: LoginTypeValues })
  type: LoginType = null;

  @ApiProperty()
  @Column("text")
  identifier1: string = null;

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
  accessToken: string = null;

  @ApiProperty()
  @Column()
  refreshToken: string = null;

  @ApiProperty()
  @Column()
  sessionIdentifier: string = null;

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
  @ManyToOne(() => User, (user) => user.session, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;
}
