import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.session, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;
}
