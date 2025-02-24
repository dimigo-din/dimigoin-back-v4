import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { CommonUserPermission } from "../common/mapper/permissions";
import { numberPermission } from "../common/utils/permission.util";

import { Login, Session } from "./auth.schema";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { unique: true })
  @Index()
  email: string = null;

  @Column()
  name: string = null;

  @Column()
  nickname: string = null;

  @Column("int", { default: 0 })
  lvl: number = 0;

  @Column("int", { default: 7500 })
  rating: number = 7500;

  @Column("varchar", { default: numberPermission(...CommonUserPermission) })
  permission: string;

  @OneToMany(() => Login, (login) => login.user)
  login: Login[];

  @OneToMany(() => Session, (session) => session.user)
  session: Login[];
}
