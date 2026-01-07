import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import {
  type FacilityReportStatus,
  type FacilityReportType,
  FacilityReportTypeValues,
} from "../common/mapper/types";
import type { User } from "./user.schema";
import { User as UserEntity } from "./user.schema";

@Entity()
export class FacilityReport {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column("text", { default: "Waiting" })
  status: FacilityReportStatus;

  @ApiProperty()
  @Column({ type: "enum", enum: FacilityReportTypeValues })
  report_type: FacilityReportType;

  @ApiProperty()
  @Column()
  subject: string;

  @ApiProperty()
  @Column()
  body: string;

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @ApiProperty({ type: () => [FacilityReportComment] })
  @OneToMany(
    () => FacilityReportComment,
    (facilityReportComment) => facilityReportComment.parent,
  )
  comment: FacilityReportComment[];

  @ApiProperty({ type: () => [FacilityImg] })
  @OneToMany(
    () => FacilityImg,
    (facilityImg) => facilityImg.parent,
    {
      cascade: ["insert", "update"],
    },
  )
  file: FacilityImg[];

  @ManyToOne(
    () => UserEntity,
    (user) => user.facilityReport,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  user: User;
}

@Entity()
export class FacilityImg {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  location: string;

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @ApiProperty({ type: () => FacilityReport })
  @ManyToOne(
    () => FacilityReport,
    (facilityReport) => facilityReport.file,
    {
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  )
  parent: FacilityReport;
}

@Entity()
export class FacilityReportComment {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => FacilityReportComment })
  @ManyToOne(() => FacilityReportComment, {
    nullable: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  comment_parent: FacilityReportComment | null;

  @ApiProperty({ type: () => FacilityReport })
  @ManyToOne(
    () => FacilityReport,
    (facilityReport) => facilityReport.comment,
  )
  parent: FacilityReport;

  @ApiProperty()
  @Column()
  text: string;

  @ApiProperty()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  created_at: Date;

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(
    () => UserEntity,
    (user) => user.facilityReportComment,
  )
  user: User;
}
