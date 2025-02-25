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

  @Column("int", { nullable: true })
  grade: number | null;

  @Column("int", { nullable: true })
  number: number | null;

  @Column()
  name: string;

  @Column("varchar", { nullable: true })
  card_barcode: string | null;

  @Column("varchar", { default: numberPermission(...CommonUserPermission) })
  permission: string;

  @OneToMany(() => Login, (login) => login.user)
  login: Login[];

  @OneToMany(() => Session, (session) => session.user)
  session: Login[];
}
