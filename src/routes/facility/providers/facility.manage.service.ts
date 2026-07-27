import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { facilityImg, facilityReport, facilityReportComment } from "#/db/schema";
import {
  facilityReportWithCommentFileUser,
  facilityReportWithFileUser,
  facilityReportWithUser,
} from "#/db/with";
import { ErrorMsg } from "$mapper/error";
import { UserJWT } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { R2 } from "$modules/r2.module";
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
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(R2) private readonly r2: S3Client,
    private readonly config: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  private get bucket() {
    return this.config.get<string>("R2_BUCKET_NAME") ?? "";
  }

  async getImg(data: FacilityImgIdDTO) {
    const img = await findOrThrow(
      this.db.query.facilityImg.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    return {
      url: `${this.config.get<string>("R2_PUBLIC_URL")}/${img.location}`,
      filename: img.name,
    };
  }

  async deleteImg(data: FacilityImgIdDTO) {
    const img = await findOrThrow(
      this.db.query.facilityImg.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.id) } }),
    );

    await this.r2.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: img.location }));
    await this.db.delete(facilityImg).where(eq(facilityImg.id, img.id));

    return img;
  }

  async reportList(data: GetReportListDTO) {
    const offset = (data.page ? data.page - 1 : 0) * 10;

    return await this.db.query.facilityReport.findMany({
      with: facilityReportWithUser,
      limit: 10,
      offset: offset,
      orderBy: (facilityReport, { desc }) => desc(facilityReport.created_at),
    });
  }

  async getReport(data: FacilityReportIdDTO) {
    const report = await this.db.query.facilityReport.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      with: facilityReportWithCommentFileUser,
    });

    return report ?? null;
  }

  async createReport(userJwt: UserJWT, data: ReportFacilityDTO, files: Array<FileDTO>) {
    if (!(await this.cacheService.facilityReportRateLimit(userJwt.id))) {
      throw new HttpException(ErrorMsg.RateLimit_Exceeded(), HttpStatus.TOO_MANY_REQUESTS);
    }

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
      for (const file of files) {
        await this.r2.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: file.filename,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
      }

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
      with: facilityReportWithFileUser,
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

    if (data.parent_comment != null) {
      const parentCommentId = data.parent_comment;
      const parentCommentRow = await findOrThrow(
        this.db.query.facilityReportComment.findFirst({
          where: { RAW: (t, { eq }) => eq(t.id, parentCommentId) },
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
