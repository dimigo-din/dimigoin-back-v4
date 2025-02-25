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
  email: string;

  @Column("int")
  grade: number;

  @Column("int")
  number: number;

  @Column()
  name: string = null;

  @Column()
  card_barcode: string;

  @Column("varchar", { default: numberPermission(...CommonUserPermission) })
  permission: string;

  @OneToMany(() => Login, (login) => login.user)
  login: Login[];

  @OneToMany(() => Session, (session) => session.user)
  session: Login[];
}
