import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';

import {
  Group,
  GroupDocument,
  Student,
  StudentDocument,
  Teacher,
  TeacherDocument,
} from 'src/common/schemas';
import {
  addGroupDto,
  CreateStudentDto,
  CreateTeacherDto,
  ResponseDto,
} from 'src/common/dto';

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { LaundryService } from '../laundry/laundry.service';
import { StayService } from '../stay/stay.service';
import { FrigoService } from '../frigo/frigo.service';
import { Permissions } from 'src/common/types';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,

    @InjectModel(Teacher.name)
    private teacherModel: Model<TeacherDocument>,

    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,

    private laundryService: LaundryService,
    private stayService: StayService,
    private frigoService: FrigoService,
  ) {}

  async getUserByObjectId(
    id: string,
  ): Promise<StudentDocument | TeacherDocument> {
    const student = await this.studentModel.findOne({ _id: id }).lean();
    if (student) return student;

    const teacher = await this.teacherModel.findOne({ _id: id }).lean();
    if (teacher) return teacher;

    throw new HttpException('해당 계정이 없습니다.', 404);
  }

  async getAllStudent(): Promise<Student[]> {
    const students = await this.studentModel.find();
    return students;
  }

  async getStudentById(_id: string): Promise<Student> {
    if (!Types.ObjectId.isValid(_id))
      throw new HttpException('ObjectId 형식이 아닙니다.', 404);

    const student = await this.studentModel.findById(_id);
    if (!student) throw new HttpException('학생이 존재하지 않습니다.', 404);

    return student;
  }

  async getAllTeacher(): Promise<Teacher[]> {
    const teachers = await this.teacherModel.find();
    return teachers;
  }

  async getTeacherById(_id: string): Promise<Teacher> {
    if (!Types.ObjectId.isValid(_id))
      throw new HttpException('ObjectId 형식이 아닙니다.', 404);

    const teacher = await this.teacherModel.findById(_id);
    if (!teacher) throw new HttpException('선생님이 존재하지 않습니다.', 404);

    return teacher;
  }

  async createStudent(data: CreateStudentDto): Promise<Student> {
    const existingUser = await this.studentModel.findOne({
      id: data.id,
    });

    if (existingUser) throw new HttpException('아이디가 중복됩니다.', 404);

    const salt = crypto.randomBytes(20).toString('hex');
    const hashedPassword = await bcrypt.hash(data.password + salt, 10);
    delete data['password'];

    const student = new this.studentModel({
      ...data,
      password_hash: hashedPassword,
      password_salt: salt,
      permissions: { view: [], edit: [] },
      groups: [],
    });

    await student.save();

    return student;
  }

  async getMyInformation(user: StudentDocument): Promise<any> {
    let laundry = await this.laundryService.getMyLaundry(user);
    const stay = await this.stayService.getMyStay(user);
    const frigo = await this.frigoService.getMyFrigo(user);
    if (typeof laundry == 'number') laundry++;

    const isWeekend = new Date().getDay() % 6 === 0;
    // replace null with Weekday Outgo ( TBA )
    const stayOutgo = await this.stayService.getMyStayOutgo(user);
    const outgo = isWeekend ? stayOutgo : null;

    return {
      laundry: laundry ? laundry : null,
      stay: stay ? stay : null,
      frigo: frigo ? frigo : null,
      outgo: outgo ? outgo : null,
    };
  }

  async createTeacher(data: CreateTeacherDto): Promise<Teacher> {
    const existingUser = await this.teacherModel.findOne({
      id: data.id,
    });

    if (existingUser) throw new HttpException('아이디가 중복됩니다.', 404);

    const salt = crypto.randomBytes(20).toString('hex');
    const hashedPassword = await bcrypt.hash(data.password + salt, 10);
    delete data['password'];

    const teacher = new this.teacherModel({
      ...data,
      password_hash: hashedPassword,
      password_salt: salt,
    });

    await teacher.save();

    return teacher;
  }

  async addTeacherGroup(data: addGroupDto): Promise<Teacher> {
    if (!Types.ObjectId.isValid(data.groupId))
      throw new HttpException('ObjectId 형식이 아닙니다.', 404);

    const group = await this.groupModel.findById(data.groupId);
    if (!group) throw new HttpException('해당 Group이 존재하지 않습니다.', 404);

    const teacher = await this.teacherModel.findById(data.teacherId);
    if (!teacher)
      throw new HttpException('해당 선생님이 존재하지 않습니다.', 404);

    teacher.groups.push(data.groupId);

    await teacher.save();
    return teacher;
  }

  async createSuperuser(): Promise<ResponseDto> {
    const SUPERUSER = process.env.INIT_SUPERUSER;
    const id = SUPERUSER.split(':')[0];
    const password = SUPERUSER.split(':')[1];
    const existingUser = await this.teacherModel.findOne({ id: id });
    if (existingUser)
      throw new HttpException('SUPERUSER가 이미 존재합니다.', 404);

    const salt = crypto.randomBytes(20).toString('hex');
    const hashedPassword = await bcrypt.hash(password + salt, 10);

    const user = new this.teacherModel({
      name: 'SUPERUSER',
      id: id,
      password_hash: hashedPassword,
      password_salt: salt,
      gender: 'M',
      groups: [],
      permissions: { view: ['@'], edit: ['@'] },
      positions: ['A', 'T', 'D'],
    });

    await user.save();

    return { status: 200, message: 'success' };
  }

  async getPermissionByGroup(groups: Types.ObjectId[]): Promise<Permissions> {
    const permission = { view: [], edit: [] };

    for (let i = 0; i < groups.length; i++) {
      const groupPerm = await this.groupModel.findById(groups[i]);
      permission.view.push(...groupPerm.permissions.view);
      permission.edit.push(...groupPerm.permissions.edit);
    }

    return permission;
  }

  // async getPermission(
  //   user: StudentDocument | TeacherDocument,
  // ): Promise<boolean> {

  // }
}
