import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { StudentUserPermission } from "../common/mapper/permissions";
import { numberPermission } from "../common/utils/permission.util";

import { Login, Session } from "./auth.schema";
import { FacilityReport, FacilityReportComment } from "./facility.schema";
import { FrigoApply } from "./frigo.schema";
import { LaundryApply } from "./laundry.schema";
import { PushSubject, PushSubscription } from "./push.schema";
import { StayApply } from "./stay.schema";
import { WakeupSongApplication, WakeupSongVote } from "./wakeup.schema";

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
  @Column()
  picture: string;

  @ApiProperty()
  @Column("varchar", { default: numberPermission(...StudentUserPermission) })
  permission: string;

  @OneToMany(
    () => Login,
    (login) => login.user,
  )
  login: Login[];

  @OneToMany(
    () => Session,
    (session) => session.user,
  )
  session: Session[];

  @OneToMany(
    () => StayApply,
    (stayApply) => stayApply.user,
  )
  stay_apply: StayApply[];

  @OneToMany(
    () => LaundryApply,
    (laundryApply) => laundryApply.user,
  )
  laundryApplies: LaundryApply[];

  @OneToMany(
    () => FrigoApply,
    (frigo) => frigo.user,
  )
  frigo: FrigoApply[];

  @OneToMany(
    () => FacilityReport,
    (facilityReport) => facilityReport.user,
  )
  facilityReport: FacilityReport[];

  @OneToMany(
    () => FacilityReportComment,
    (facilityReportComment) => facilityReportComment.user,
  )
  facilityReportComment: FacilityReportComment[];

  @OneToMany(
    () => WakeupSongApplication,
    (wakeupSongApplication) => wakeupSongApplication.user,
  )
  wakeupSongApplication: WakeupSongApplication;

  @OneToMany(
    () => WakeupSongVote,
    (wakeupSongVote) => wakeupSongVote.user,
  )
  wakeupSongVote: WakeupSongVote;

  @OneToMany(
    () => PushSubscription,
    (pushSubscription) => pushSubscription.user,
  )
  pushSubscriptions: PushSubscription[];

  @OneToMany(
    () => PushSubject,
    (pushSubject) => pushSubject.user,
  )
  pushSubject: PushSubject[];
}
