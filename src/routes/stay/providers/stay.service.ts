import { forwardRef, HttpException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import {
  ApplyStayDto,
  ApplyStayOutgoDto,
  ManageStayOutgoDto,
  CreateStayDto,
  ManageStayDto,
  ApplyStayForceDto,
} from "../dto/stay.dto";
import { ResponseDto } from "src/common/dto";
import {
  Stay,
  StayDocument,
  StayApplication,
  StayApplicationDocument,
  StayOutgo,
  StayOutgoDocument,
  StudentDocument,
} from "src/schemas";
import moment from "moment";
import { UserService } from "../../user/providers/user.service";

@Injectable()
export class StayService {
  constructor(
    @InjectModel(Stay.name)
    private stayModel: Model<StayDocument>,

    @InjectModel(StayApplication.name)
    private stayApplicationModel: Model<StayApplicationDocument>,

    @InjectModel(StayOutgo.name)
    private stayOutgoModel: Model<StayOutgoDocument>,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  // Stay
  async getAllStay(): Promise<StayDocument[]> {
    const stays = await this.stayModel.find();
    return stays;
  }

  async getStayInfo(stayId: string): Promise<any> {
    const stay = await this.stayModel.findById(stayId);
    if (!stay)
      throw new HttpException("해당 잔류일정이 존재하지 않습니다.", 404);

    const applications = await this.stayApplicationModel.find({
      stay: stay._id,
    });

    const result = [];
    for (const application of applications) {
      const student = await this.userService.getStudentById(
        application.user.toString(),
      );
      result.push({
        _id: student._id,
        grade: student.grade,
        class: student.class,
        number: student.number,
        name: student.name,
        gender: student.gender,
        seat: application.seat,
        reason: application.reason,
      });
    }

    return result;
  }

  async getCurrentStay(): Promise<StayDocument> {
    const stay = await this.stayModel.findOne({ current: true });

    return stay;
  }

  async getStayApplication(id: string): Promise<StayApplicationDocument[]> {
    const stay = await this.stayModel.findById(id);
    if (!stay)
      throw new HttpException("해당 잔류일정이 존재하지 않습니다.", 404);

    const appliers = await this.stayApplicationModel.find({ stay: stay._id });

    return appliers;
  }

  async createStay(data: CreateStayDto): Promise<StayDocument> {
    const existingStay = await this.stayModel.findOne({ current: true });
    if (data.current && existingStay)
      throw new HttpException("이미 활성화된 잔류일정이 존재합니다.", 403);

    const stay = new this.stayModel({
      ...data,
    });

    await stay.save();

    return stay;
  }

  async manageStay(data: ManageStayDto): Promise<StayDocument> {
    const existingStay = await this.stayModel.findOne({ current: true });
    if (data.current && existingStay)
      throw new HttpException("이미 활성화된 잔류일정이 존재합니다.", 403);

    const stay = await this.stayModel.findById(data.stay);
    if (!stay)
      throw new HttpException("해당 잔류일정이 존재하지 않습니다.", 404);
    stay.current = data.current;

    await stay.save();

    return stay;
  }

  async applyStay(
    data: ApplyStayDto,
    user: StudentDocument,
  ): Promise<StayApplicationDocument> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) throw new HttpException("신청가능한 잔류일정이 없습니다.", 404);

    const now = moment(new Date());

    if (
      !now.isBetween(
        stay.duration[user.grade - 1][0],
        stay.duration[user.grade - 1][1],
      )
    )
      throw new HttpException("해당 학년의 신청기간이 아닙니다.", 403);

    if (!stay.seat[user.gender + user.grade].includes(data.seat))
      throw new HttpException("해당 학년이 신청 가능한 좌석이 아닙니다.", 403);

    const existingApplication = await this.stayApplicationModel.findOne({
      user: user._id,
    });
    if (existingApplication)
      throw new HttpException("이미 잔류를 신청했습니다.", 403);

    const application = new this.stayApplicationModel({
      ...data,
      user: user._id,
      stay: stay._id,
    });

    await application.save();

    return application;
  }

  async applyStayForce(
    data: ApplyStayForceDto,
  ): Promise<StayApplicationDocument> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) throw new HttpException("신청가능한 잔류일정이 없습니다.", 404);

    const user = await this.userService.getStudentById(data.user.toString());
    if (!user) throw new HttpException("해당 학생을 찾을 수 없습니다.", 404);

    if (!stay.seat[user.gender + user.grade].includes(data.seat))
      throw new HttpException("해당 학년이 신청 가능한 좌석이 아닙니다.", 403);

    const existingApplication = await this.stayApplicationModel.findOne({
      user: user._id,
    });
    if (existingApplication)
      throw new HttpException("이미 잔류를 신청했습니다.", 403);

    const application = new this.stayApplicationModel({
      ...data,
      stay: stay._id,
    });

    await application.save();

    return application;
  }

  async cancelStay(user: string, force: boolean): Promise<ResponseDto> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) throw new HttpException("취소가능한 잔류일정이 없습니다.", 404);

    const student = await this.userService.getStudentById(user);
    const now = moment(new Date());
    if (
      !force &&
      !now.isBetween(
        stay.duration[student.grade - 1][0],
        stay.duration[student.grade - 1][1],
      )
    )
      throw new HttpException("해당 학년의 취소기간이 아닙니다.", 403);

    const application = await this.stayApplicationModel.findOneAndDelete({
      stay: stay._id,
      user: user,
    });
    if (!application)
      throw new HttpException("취소할 잔류신청이 없습니다.", 404);

    await this.stayOutgoModel.deleteMany({ user: user });

    return { statusCode: 200, message: "success" };
  }

  async getMyStay(user: StudentDocument): Promise<object | boolean> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) return false;

    const application = await this.stayApplicationModel.findOne({
      stay: stay._id,
      user: user._id,
    });
    if (!application) return false;
    if (!application.seat) application.seat = "미선택";
    return { seat: application.seat, reason: application.reason };
  }

  // Stay Outgo
  async getMyStayOutgo(user: StudentDocument): Promise<any> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) return false;

    const outgo = await this.stayOutgoModel.find({
      stay: stay._id,
      user: user._id,
    });

    if (outgo.length == 0) return false;

    return outgo;
  }

  async applyStayOutgo(
    application: ApplyStayOutgoDto,
    user: ObjectId,
  ): Promise<StayOutgoDocument> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) throw new HttpException("신청가능한 잔류일정이 없습니다.", 404);

    const start = moment(application.duration.start);
    const end = moment(application.duration.end);

    for (const StayDate of stay.dates) {
      const startline = moment(StayDate.date).startOf("day");
      const endline = startline.clone().endOf("day");

      if (application.free) {
        if (moment(application.date).isSame(StayDate.date)) {
          const existingOutgoFree = await this.stayOutgoModel.findOne({
            stay: stay._id,
            user: user,
            date: StayDate.date,
            free: true,
          });

          if (existingOutgoFree)
            throw new HttpException("이미 자기개발 외출을 신청했습니다.", 403);

          const mealLunch = application.meal.lunch;
          delete application["duration"];
          delete application["reason"];
          delete application["meal"];

          const stayOutgo = new this.stayOutgoModel({
            ...application,
            meal: {
              breakfast: false,
              lunch: mealLunch,
              dinner: false,
            },
            user: user,
            stay: stay._id,
            status: "A",
          });

          await stayOutgo.save();
          return stayOutgo;
        }
      } else if (
        start.isBetween(startline, endline) &&
        end.isBetween(startline, endline) &&
        end.isAfter(start)
      ) {
        const stayOutgo = new this.stayOutgoModel({
          ...application,
          user: user,
          stay: stay._id,
          status: "W",
        });

        await stayOutgo.save();
        return stayOutgo;
      }
    }

    throw new HttpException("올바른 잔류외출 신청이 아닙니다.", 404);
  }

  async cancelStayOutgo(
    outgoId: string,
    user: StudentDocument,
  ): Promise<ResponseDto> {
    const stayOutgo = await this.stayOutgoModel.findById(outgoId);
    if (!stayOutgo)
      throw new HttpException("해당 잔류외출 신청이 존재하지 않습니다.", 404);
    if (stayOutgo.user != user._id)
      throw new HttpException("자신의 잔류외출 신청만 취소할수 있습니다.", 403);

    await this.stayOutgoModel.findByIdAndDelete(outgoId);

    return { statusCode: 200, message: "success" };
  }

  async manageStayOutgo(data: ManageStayOutgoDto): Promise<StayOutgoDocument> {
    const stayOutgo = await this.stayOutgoModel.findById(data.outgo);
    if (!stayOutgo)
      throw new HttpException("해당 잔류외출 신청이 존재하지 않습니다.", 404);
    if (stayOutgo.free)
      throw new HttpException("자기개발 외출은 수정할 수 없습니다.", 403);

    stayOutgo.status = data.status;

    await stayOutgo.save();

    return stayOutgo;
  }

  // util
  async isStay(date: Date): Promise<number> {
    const stay = await this.stayModel.findOne({ current: true });
    if (!stay) return 0;
    const startline = moment(stay.start);
    const endline = moment(stay.end).endOf("day");
    const target = moment(date);

    if (target.isBetween(startline, endline)) return 1;
    return 0;
  }
}