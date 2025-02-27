import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { CommonUserPermission } from "../common/mapper/permissions";
import { numberPermission } from "../common/utils/permission.util";

import { Login, OAuth_Client, OAuth_Code, Session } from "./auth.schema";

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
  class: number | null;

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
  session: Session[];

  @OneToMany(() => OAuth_Client, (oauth_client) => oauth_client.user)
  oauth_client: OAuth_Client[];

  @OneToMany(() => OAuth_Code, (oauth_code) => oauth_code.oauth_user)
  oauth_code: OAuth_Code[];
}
