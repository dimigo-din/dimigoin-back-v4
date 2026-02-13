import path from "node:path";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { facilityImg, facilityReport, facilityReportComment } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { FileDTO } from "~facility/dto/facility.dto";
import {
  ChangeFacilityReportStatusDTO,
  ChangeFacilityReportTypeDTO,
  FacilityImgIdDTO,
  FacilityReportCommentIdDTO,
  FacilityReportIdDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "~facility/dto/facility.manage.dto";

@Injectable()
export class FacilityManageService {
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

  async deleteImg(data: FacilityImgIdDTO) {
    const img = await findOrThrow(
      this.db.query.facilityImg.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    await this.db.delete(facilityImg).where(eq(facilityImg.id, img.id));

    return img;
  }

  async reportList(data: GetReportListDTO) {
    const offset = (data.page ? data.page - 1 : 0) * 10;

    return await this.db.query.facilityReport.findMany({
      with: { user: true },
      limit: 10,
      offset: offset,
      orderBy: (facilityReport, { desc }) => desc(facilityReport.created_at),
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

    return report ?? null;
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
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
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

  async deleteReport(data: FacilityReportIdDTO) {
    const report = await findOrThrow(
      this.db.query.facilityReport.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    await this.db.delete(facilityReport).where(eq(facilityReport.id, report.id));

    return report;
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

  async deleteComment(data: FacilityReportCommentIdDTO) {
    const comment = await findOrThrow(
      this.db.query.facilityReportComment.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    await this.db.delete(facilityReportComment).where(eq(facilityReportComment.id, comment.id));

    return comment;
  }

  async changeType(data: ChangeFacilityReportTypeDTO) {
    await findOrThrow(
      this.db.query.facilityReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    const [updated] = await this.db
      .update(facilityReport)
      .set({ report_type: data.type })
      .where(eq(facilityReport.id, data.id))
      .returning();

    return updated;
  }

  async changeStatus(data: ChangeFacilityReportStatusDTO) {
    await findOrThrow(
      this.db.query.facilityReport.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    const [updated] = await this.db
      .update(facilityReport)
      .set({ status: data.status })
      .where(eq(facilityReport.id, data.id))
      .returning();

    return updated;
  }
}
