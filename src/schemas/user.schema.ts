import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StudentUserPermission } from "$mapper/permissions";
import { numberPermission } from "$utils/permission.util";
import type { Login, Session } from "./auth.schema";
import { Login as LoginEntity, Session as SessionEntity } from "./auth.schema";
import type { FacilityReport, FacilityReportComment } from "./facility.schema";
import {
  FacilityReportComment as FacilityReportCommentEntity,
  FacilityReport as FacilityReportEntity,
} from "./facility.schema";
import type { FrigoApply } from "./frigo.schema";
import { FrigoApply as FrigoApplyEntity } from "./frigo.schema";
import type { LaundryApply } from "./laundry.schema";
import { LaundryApply as LaundryApplyEntity } from "./laundry.schema";
import type { PushSubject, PushSubscription } from "./push.schema";
import {
  PushSubject as PushSubjectEntity,
  PushSubscription as PushSubscriptionEntity,
} from "./push.schema";
import type { StayApply } from "./stay.schema";
import { StayApply as StayApplyEntity } from "./stay.schema";
import type { WakeupSongApplication, WakeupSongVote } from "./wakeup.schema";
import {
  WakeupSongApplication as WakeupSongApplicationEntity,
  WakeupSongVote as WakeupSongVoteEntity,
} from "./wakeup.schema";

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
    () => LoginEntity,
    (login) => login.user,
  )
  login: Login[];

  @OneToMany(
    () => SessionEntity,
    (session) => session.user,
  )
  session: Session[];

  @OneToMany(
    () => StayApplyEntity,
    (stayApply) => stayApply.user,
  )
  stay_apply: StayApply[];

  @OneToMany(
    () => LaundryApplyEntity,
    (laundryApply) => laundryApply.user,
  )
  laundryApplies: LaundryApply[];

  @OneToMany(
    () => FrigoApplyEntity,
    (frigo) => frigo.user,
  )
  frigo: FrigoApply[];

  @OneToMany(
    () => FacilityReportEntity,
    (facilityReport) => facilityReport.user,
  )
  facilityReport: FacilityReport[];

  @OneToMany(
    () => FacilityReportCommentEntity,
    (facilityReportComment) => facilityReportComment.user,
  )
  facilityReportComment: FacilityReportComment[];

  @OneToMany(
    () => WakeupSongApplicationEntity,
    (wakeupSongApplication) => wakeupSongApplication.user,
  )
  wakeupSongApplication: WakeupSongApplication[];

  @OneToMany(
    () => WakeupSongVoteEntity,
    (wakeupSongVote) => wakeupSongVote.user,
  )
  wakeupSongVote: WakeupSongVote[];

  @OneToMany(
    () => PushSubscriptionEntity,
    (pushSubscription) => pushSubscription.user,
  )
  pushSubscriptions: PushSubscription[];

  @OneToMany(
    () => PushSubjectEntity,
    (pushSubject) => pushSubject.user,
  )
  pushSubject: PushSubject[];
}
