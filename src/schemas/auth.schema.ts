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
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.login, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;

  @Column({ enum: LoginTypeValues })
  type: LoginType = null;

  @Column("text")
  identifier1: string = null;

  @Column("text", { nullable: true })
  identifier2: string | null = null;
}

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  accessToken: string = null;

  @Column()
  refreshToken: string = null;

  @Column()
  sessionIdentifier: string = null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updated_at: Date;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.session, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;
}
