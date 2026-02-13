import path from "node:path";
import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { facilityImg, facilityReport, facilityReportComment } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { FileDTO } from "~facility/dto/facility.dto";
import {
  FacilityImgIdDTO,
  FacilityReportIdDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "~facility/dto/facility.student.dto";

@Injectable()
export class FacilityStudentService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getImg(data: FacilityImgIdDTO) {
    const img = await findOrThrow(
      this.db.query.facilityImg.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    return {
      stream: Bun.file(path.join(process.cwd(), "uploads/facility", img.location)).stream(),
      filename: img.name,
    };
  }

  async reportList(data: GetReportListDTO) {
    const offset = (data.page ? data.page - 1 : 0) * 10;

    const reports = await this.db.query.facilityReport.findMany({
      with: { user: true },
      limit: 10,
      offset: offset,
      orderBy: (facilityReport, { desc }) => desc(facilityReport.created_at),
    });

    return reports.map((r) => {
      return { ...r, user: r.user ? { id: r.user.id } : null };
    });
  }

  async getReport(data: FacilityReportIdDTO) {
    const report = await this.db.query.facilityReport.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      with: {
        comment: true,
        file: true,
        user: true,
      },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return report;
  }

  async createReport(userJwt: UserJWT, data: ReportFacilityDTO, files: Array<FileDTO>) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const [report] = await this.db
      .insert(facilityReport)
      .values({
        report_type: data.report_type,
        subject: data.subject,
        body: data.body,
        userId: dbUser.id,
      })
      .returning();

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (files.length > 0) {
      await this.db.insert(facilityImg).values(
        files.map((file) => ({
          name: file.originalname,
          location: file.filename ?? "",
          parentId: report.id,
        })),
      );
    }

    return await this.db.query.facilityReport.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, report.id) },
      with: { file: true, user: true },
    });
  }

  async writeComment(userJwt: UserJWT, data: PostCommentDTO) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    await findOrThrow(
      this.db.query.facilityReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.post) },
      }),
    );

    if (data.parent_comment) {
      const parentCommentRow = await findOrThrow(
        this.db.query.facilityReportComment.findFirst({
          where: { RAW: (t, { eq }) => eq(t.id, data.parent_comment) },
        }),
      );
      if (parentCommentRow.parentId !== data.post) {
        throw new HttpException(ErrorMsg.Invalid_Parent(), HttpStatus.BAD_REQUEST);
      }
    }

    const [comment] = await this.db
      .insert(facilityReportComment)
      .values({
        parentId: data.post,
        commentParentId: data.parent_comment ?? undefined,
        text: data.text,
        userId: dbUser.id,
      })
      .returning();

    if (!comment) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return await findOrThrow(
      this.db.query.facilityReportComment.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, comment.id) },
      }),
    );
  }
}
