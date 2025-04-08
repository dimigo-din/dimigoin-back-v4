import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { StudentUserPermission } from "../common/mapper/permissions";
import { Gender } from "../common/mapper/types";
import { numberPermission } from "../common/utils/permission.util";

import { Login, Session } from "./auth.schema";
import { StayApply } from "./stay.schema";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  @Column("varchar", { nullable: true })
  card_barcode: string | null;

  @Column("varchar", { default: numberPermission(...StudentUserPermission) })
  permission: string;

  @OneToMany(() => Login, (login) => login.user)
  login: Login[];

  @OneToMany(() => Session, (session) => session.user)
  session: Session[];

  @OneToMany(() => StayApply, (stayApply) => stayApply.user)
  stay_apply: StayApply[];
}
