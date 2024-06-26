import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import XLSX from "xlsx";

import { ResponseDto } from "src/common/dto";

import {
  Afterschool,
  AfterschoolApplication,
  AfterschoolDocument,
  AfterschoolApplicationDocument,
  StudentDocument,
} from "src/schemas";

import { ManageAfterschoolDto } from "../dto";

@Injectable()
export class AfterschoolManageService {
  constructor(
    @InjectModel(Afterschool.name)
    private afterschoolModel: Model<AfterschoolDocument>,

    @InjectModel(AfterschoolApplication.name)
    private afterschoolApplicationModel: Model<AfterschoolApplicationDocument>,
  ) {}

  private extractGrade(text) {
    const gradeRegex = /대상 : (.*?)(\d+)(?:학년)/;
    const match = text.match(gradeRegex);
    const grades = [];

    if (match) {
      const gradeInfo = match[1] + match[2];
      const gradeNumbers = gradeInfo
        .replace(/[^0-9,]/g, "")
        .split(",")
        .map((g) => parseInt(g.trim()));

      grades.push(...gradeNumbers);
    }

    return grades;
  }

  async getAllAfterschool(): Promise<AfterschoolDocument[]> {
    const afterschools = await this.afterschoolModel.find();

    return afterschools;
  }

  async uploadAfterschool(file: Express.Multer.File): Promise<ResponseDto> {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 6,
    });

    // remove example
    sheetData.splice(0, 2);

    const timeRegex = /((\d+,\s*\d+)|(\d+))타임/;

    const afterschools = [];
    for (const data of sheetData) {
      let description = "";
      for (const key in data as object) {
        if (key.includes("강좌내용 및 소개")) {
          description = data[key];
        }
      }

      let grade = this.extractGrade(description);
      if (grade.length == 0) grade = [1, 2, 3];

      const timeMatch = data["시간"] && data["시간"].match(timeRegex);
      const time =
        timeMatch && timeMatch[1]
          ? timeMatch[1]
              .replace(/\s/g, "")
              .split(",")
              .map((t: string) => parseInt(t))
          : [];

      if (typeof data["희망인원"] === "string") {
        data["희망인원"] = data["희망인원"].split("~")[1].split("(")[0];
        if (data["희망인원"].includes("\r\n"))
          data["희망인원"] = data["희망인원"].split("\r\n")[0];
      }

      const isExisting = await this.afterschoolModel.findOne({
        name: data["과목명"],
        grade: grade,
      });
      if (isExisting) continue;

      afterschools.push({
        name: data["과목명"],
        subject: data["분야"] || "추가될 예정입니다.",
        description: description || "추가될 예정입니다.",
        grade: grade,
        teacher: data["강사명"],
        limit: parseInt(data["희망인원"]),
        time: time,
        day: data["요일"],
      });
    }

    await this.afterschoolModel.insertMany(afterschools);
    return { statusCode: 201, message: "success" };
  }

  async getAfterschoolByUser(
    user: StudentDocument,
  ): Promise<AfterschoolDocument[]> {
    const afterschools = await this.afterschoolModel.find({
      grade: user.grade,
    });

    return afterschools;
  }

  async getAfterschoolById(id: string): Promise<AfterschoolDocument> {
    const afterschool = await this.afterschoolModel.findById(id);

    return afterschool;
  }

  async createAfterschoolById(
    data: ManageAfterschoolDto,
  ): Promise<AfterschoolDocument> {
    const afterschool = new this.afterschoolModel({ ...data });

    await afterschool.save();

    return afterschool;
  }

  async manageAfterschoolById(
    id: string,
    data: ManageAfterschoolDto,
  ): Promise<AfterschoolDocument> {
    const afterschool = await this.afterschoolModel.findById(id);
    if (!afterschool)
      throw new HttpException("해당 방과후가 존재하지 않습니다.", 404);

    Object.assign(afterschool, data);
    await afterschool.save();

    return afterschool;
  }

  async deleteAfterschoolById(id: string): Promise<AfterschoolDocument> {
    const afterschool = await this.afterschoolModel
      .findByIdAndDelete(id)
      .lean();

    if (!afterschool)
      throw new HttpException("해당 방과후가 존재하지 않습니다.", 404);

    return afterschool;
  }

  // Afterschool Application

  async getAllApplication(): Promise<AfterschoolApplicationDocument[]> {
    const applications = await this.afterschoolApplicationModel.find();

    return applications;
  }

  async getApplicationById(id: string): Promise<any> {
    const application = await this.afterschoolApplicationModel.findById(id);
    if (!application)
      throw new HttpException("해당 방과후 신청이 없습니다.", 404);
    const afterschool = await this.afterschoolModel.findById(
      application.afterschool,
    );

    return { ...application, afterschoolInfo: afterschool };
  }

  async getMyApplication(
    user: StudentDocument,
  ): Promise<AfterschoolApplicationDocument[]> {
    const applications = await this.afterschoolApplicationModel
      .find({ user: new Types.ObjectId(user._id) })
      .lean();

    const result = [];
    for (const application of applications) {
      const afterschool = await this.afterschoolModel
        .findById(application.afterschool)
        .lean();
      result.push({
        ...application,
        afterschoolInfo: afterschool,
      });
    }

    return result;
  }

  async createApplication(
    id: string,
    user: StudentDocument,
  ): Promise<AfterschoolApplicationDocument> {
    const afterschool = await this.afterschoolModel.findById(id);
    if (!afterschool)
      throw new HttpException("해당 방과후가 존재하지 않습니다.", 404);
    if (!afterschool.grade.includes(user.grade))
      throw new HttpException("신청 가능한 학년이 아닙니다.", 404);

    const applications = await this.afterschoolApplicationModel.find({
      user: user._id,
    });

    // time duplicate check
    for (const apply of applications) {
      const as = await this.afterschoolModel.findById(apply.afterschool);
      if (as.day == afterschool.day) {
        const ducplicate = as.time.filter((v) => as.time.includes(v));
        if (ducplicate.length != 0)
          throw new HttpException("방과후 시간이 중복됩니다.", 404);
      }
    }

    const application = new this.afterschoolApplicationModel({
      user: user._id,
      grade: user.grade,
      afterschool: afterschool._id,
    });

    await application.save();

    return application;
  }

  async cancelApplication(
    id: string,
    user: StudentDocument,
  ): Promise<ResponseDto> {
    const afterschool = await this.afterschoolModel.findById(id);
    if (!afterschool)
      throw new HttpException("해당 방과후가 존재하지 않습니다.", 404);

    const application = await this.afterschoolApplicationModel
      .findOneAndDelete({ afterschool: afterschool._id, user: user._id })
      .lean();

    if (!application)
      throw new HttpException("방과후를 신청하지 않았습니다.", 404);

    return { statusCode: 201, message: "success" };
  }
}
