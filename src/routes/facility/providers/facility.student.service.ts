import * as fs from "node:fs";
import * as path from "node:path";

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { safeFindOne } from "../../../common/utils/safeFindOne.util";
import { FacilityImg, FacilityReport, FacilityReportComment, User } from "../../../schemas";
import { UserManageService } from "../../user/providers";
import {
  FacilityImgIdDTO,
  FacilityReportIdDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "../dto/facility.student.dto";

@Injectable()
export class FacilityStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FacilityReport)
    private readonly facilityReportRepository: Repository<FacilityReport>,
    @InjectRepository(FacilityReportComment)
    private readonly facilityReportCommentRepository: Repository<FacilityReportComment>,
    @InjectRepository(FacilityImg)
    private readonly facilityImgRepository: Repository<FacilityImg>,
    private readonly userManageService: UserManageService,
  ) {}

  async getImg(data: FacilityImgIdDTO) {
    const img = await safeFindOne<FacilityImg>(this.facilityImgRepository, data.id);

    return {
      stream: fs.createReadStream(path.join(__dirname, "../upload", img.location)),
      filename: img.name,
    };
  }

  async reportList(data: GetReportListDTO) {
    return (
      await this.facilityReportRepository.find({
        relations: ["user"],
        take: 10,
        skip: (data.page ? data.page - 1 : 0) * 10,
        order: { created_at: "DESC" },
      })
    ).map((r) => {
      return { ...r, user: { id: r.user.id } };
    });
  }

  async getReport(data: FacilityReportIdDTO) {
    const report: FacilityReport = await this.facilityReportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.comment", "comment")
      .leftJoinAndSelect("report.file", "file")
      .leftJoinAndSelect("report.user", "user")
      .loadRelationIdAndMap("comment.parentId", "comment.parent")
      .loadRelationIdAndMap("comment.commentParentId", "comment.comment_parent")
      .where("report.id = :id", { id: data.id })
      .getOne();

    return report;
  }

  async createReport(user: UserJWT, data: ReportFacilityDTO, files: Array<Express.Multer.File>) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    const facilityReport = new FacilityReport();
    facilityReport.report_type = data.report_type;
    facilityReport.subject = data.subject;
    facilityReport.body = data.body;
    facilityReport.user = dbUser;

    const imgs: FacilityImg[] = [];
    for (const file of files) {
      const img = new FacilityImg();
      img.name = file.originalname;
      img.location = file.filename;
      img.parent = facilityReport;

      imgs.push(img);
    }

    const saved = await this.facilityReportRepository.save(facilityReport);
    return await safeFindOne<FacilityReport>(this.facilityReportRepository, saved.id);
  }

  async writeComment(user: UserJWT, data: PostCommentDTO) {
    const dbUser = await safeFindOne<User>(this.userRepository, user.id);

    const post = await safeFindOne<FacilityReport>(this.facilityReportRepository, data.post);
    const parentComment = data.parent_comment
      ? await safeFindOne<FacilityReportComment>(this.facilityReportCommentRepository, {
          where: { id: data.parent_comment },
          relations: ["parent"],
        })
      : null;
    if (parentComment && parentComment.parent.id !== data.post)
      throw new HttpException(ErrorMsg.Invalid_Parent(), HttpStatus.BAD_REQUEST);

    const comment = new FacilityReportComment();
    comment.parent = post;
    comment.comment_parent = parentComment;
    comment.text = data.text;
    comment.user = dbUser;

    const saved = await this.facilityReportCommentRepository.save(comment);
    return await safeFindOne<FacilityReportComment>(this.facilityReportCommentRepository, saved.id);
  }
}
