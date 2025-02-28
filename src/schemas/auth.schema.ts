import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
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

@Entity()
export class OAuth_Client {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("int", { generated: "increment" })
  client_id: string;

  @Column()
  client_pw: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updated_at: Date;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.oauth_client, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  user: User;

  @OneToMany(() => OAuth_Code, (oauth_code) => oauth_code.oauth_client)
  oauth_code: OAuth_Code[];

  @OneToMany(
    () => OAuth_Client_Redirect,
    (oauth_client_redirect) => oauth_client_redirect.oauth_client,
    { eager: true },
  )
  redirect: OAuth_Client_Redirect[];
}

@Entity()
export class OAuth_Client_Redirect {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  redirect_url: string;

  @ManyToOne(() => OAuth_Client, (oauth_client) => oauth_client.redirect, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  oauth_client: OAuth_Client;
}

@Entity()
export class OAuth_Code {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  code: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @JoinColumn()
  @ManyToOne(() => OAuth_Client, (oauth_client) => oauth_client.oauth_code, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  oauth_client: OAuth_Client;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.oauth_code, { eager: true })
  oauth_user: User;
}
