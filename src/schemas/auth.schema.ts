import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { LoginType } from "../common/mapper/types";
import { LoginTypeValues } from "../common/mapper/types";
import type { User } from "./user.schema";
import { User as UserEntity } from "./user.schema";

@Entity()
export class Login {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(
    () => UserEntity,
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
  @Column({ type: "enum", enum: LoginTypeValues })
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

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(
    () => UserEntity,
    (user) => user.session,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      eager: true,
    },
  )
  user: User;
}
