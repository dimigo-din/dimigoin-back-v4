import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { StudentUserPermission } from "../common/mapper/permissions";
import { numberPermission } from "../common/utils/permission.util";

import { Login, Session } from "./auth.schema";
import { StayApply } from "./stay.schema";

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column("varchar", { unique: true })
  @Index()
  email: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column("varchar", { nullable: true })
  card_barcode: string | null;

  @ApiProperty()
  @Column("varchar", { default: numberPermission(...StudentUserPermission) })
  permission: string;

  @OneToMany(() => Login, (login) => login.user)
  login: Login[];

  @OneToMany(() => Session, (session) => session.user)
  session: Session[];

  @OneToMany(() => StayApply, (stayApply) => stayApply.user)
  stay_apply: StayApply[];
}
