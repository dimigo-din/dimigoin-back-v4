import { TZDate } from "@date-fns/tz";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { format } from "date-fns";
import { Repository } from "typeorm";
import { LaundryApply, StayApply, User } from "#/schemas";
import type { UserJWT } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { ComciData } from "~user/dto";

@Injectable()
export class UserStudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StayApply)
    private readonly stayApplyRepository: Repository<StayApply>,
    @InjectRepository(LaundryApply)
    private readonly laundryApplyRepository: Repository<LaundryApply>,
    private readonly cacheService: CacheService,
  ) {}

  async getMyApplies(user: UserJWT) {
    const [stayApply, laundryApply] = await Promise.all([
      this.stayApplyRepository.findOne({ where: { user: { id: user.id } } }),
      this.laundryApplyRepository.findOne({
        where: { user: { id: user.id }, date: format(new TZDate(new Date, "Asia/Seoul"), "yyyy-MM-dd") },
        relations: { laundryTime: true, laundryMachine: true },
      }),
    ]);
    return { stayApply, laundryApply };
  }

  async getTimeTable(grade: number, klass: number) {
    let data: ComciData;
    const cached = await this.cacheService.getCachedTimetable(grade, klass);
    if (cached) {
      return cached;
    } else {
      const res = await fetch("http://comci.net:4082/36179?NzM2MjlfMjkxNzVfMF8x");
      const text = await res.text();
      data = JSON.parse(text.replace(/\0/g, "")) as ComciData;
    }

    const DIV = data.분리 ?? 100;
    const MAX_P = 8;
    const MAX_D = 5;

    const table = Array.from({ length: MAX_D }, () =>
      Array.from({ length: MAX_P }, () => ({ content: "", temp: false })),
    );

    const mTh = (mm: number, m2: number) => {
      if (m2 === 100) {
        return Math.floor(mm / m2);
      }
      return mm % m2;
    };

    const mSb = (mm: number, m2: number) => {
      if (m2 === 100) {
        return mm % m2;
      }
      return Math.floor(mm / m2);
    };

    const mTime = (mm: number, m2: number) => {
      if (m2 === 100) {
        return "";
      }
      const t = Math.floor(mm / m2);
      if (t >= 1 && t <= 26) {
        const n = t + 64;
        return `${String.fromCharCode(n)}_`;
      }
      return "";
    };

    const safeData = (m: unknown) => {
      if (m === undefined) {
        return 0;
      } else {
        return m;
      }
    };

    const getGroupCode = (
      dataObj: ComciData,
      gradeNum: number,
      classNum: number,
      subjectCode: number,
      dayOfWeek: number,
      period: number,
    ) => {
      const division = dataObj.분리 ?? 100;

      if (!Array.isArray(dataObj.동시그룹)) {
        return "";
      }

      const groupCount = dataObj.동시그룹[0]?.[0] ?? 0;

      for (let i = 1; i <= groupCount; i++) {
        for (let k = 1; k <= 2; k++) {
          let check = 0;
          let currentGroup = 0;

          const innerCount = dataObj.동시그룹[i]?.[0] ?? 0;

          for (let j = 1; j <= innerCount; j++) {
            const groupValue: number | undefined = dataObj.동시그룹[i]?.[j];
            if (groupValue === undefined) {
              continue;
            }

            const subject4 = Math.floor(groupValue / 1000);
            const group2 = Math.floor(subject4 / 1000);
            const subject2 = subject4 - group2 * 1000;
            const teacher = Math.floor(group2 / 100);
            const group = group2 - teacher * 100;
            const classroom: number = groupValue - subject4 * 1000;
            const grade2 = Math.floor(classroom / 100);
            const class2 = classroom - grade2 * 100;

            const rawValue = dataObj.자료147?.[grade2]?.[class2]?.[dayOfWeek]?.[period];
            if (rawValue === undefined) {
              check = 0;
              break;
            }

            const subject3 = Math.floor(rawValue / division);
            const teacher2 = rawValue - subject3 * division;

            if (k === 1) {
              if (!(subject2 === subject3 && teacher === teacher2)) {
                check = 0;
                break;
              }
              if (
                gradeNum === grade2 &&
                classNum === class2 &&
                subjectCode === subject2 &&
                teacher === teacher2 &&
                group > 0
              ) {
                check = 1;
                currentGroup = group;
              }
            } else {
              if (!(subject2 === subject3)) {
                check = 0;
                break;
              }
              if (
                gradeNum === grade2 &&
                classNum === class2 &&
                subjectCode === subject2 &&
                group > 0
              ) {
                check = 1;
                currentGroup = group;
              }
            }
          }
          if (check === 1) {
            const n2 = currentGroup + 64;
            return `${String.fromCharCode(n2)}_`;
          }
        }
      }
      return "";
    };

    for (let day = 1; day <= MAX_D; day++) {
      for (let per = 1; per <= MAX_P; per++) {
        const originalData = safeData(data.자료481?.[grade]?.[klass]?.[day]?.[per]);
        const dailyData = safeData(data.자료147?.[grade]?.[klass]?.[day]?.[per]) as number;

        let classroom = "";
        if (data.강의실 === 1) {
          const roomInfo = data.자료245?.[grade]?.[klass]?.[day]?.[per];
          if (typeof roomInfo === "string" && roomInfo.indexOf("_") > 0) {
            const roomParts = roomInfo.split("_");
            const roomNumber = Number(roomParts[0]);
            classroom = roomParts[1] ?? "";
            if (roomNumber > 0) {
              classroom = `\n${classroom}`;
            } else {
              classroom = "";
            }
          }
        }

        const isTemp = originalData !== dailyData;

        const row = table[day - 1];
        if (!row) {
          continue;
        }

        if (dailyData > 100) {
          let teacherName = "";
          let groupPrefix = "";
          let timePrefix = "";

          const teacherIndex = mTh(dailyData, DIV);
          let subjectIndex = mSb(dailyData, DIV);
          timePrefix = mTime(subjectIndex, DIV);
          subjectIndex = subjectIndex % DIV;

          if (data.자료446 && teacherIndex < data.자료446.length) {
            teacherName = data.자료446[teacherIndex]?.substr(0, 2) ?? "";
          }

          if (timePrefix === "") {
            groupPrefix = getGroupCode(data, grade, klass, subjectIndex, day, per);
          } else {
            groupPrefix = timePrefix;
          }

          const subject = data.자료492?.[subjectIndex] ?? "";
          const teacher = teacherName;

          let result = groupPrefix + subject;
          if (teacher) {
            result += `\n${teacher}`;
          }
          if (classroom) {
            result += classroom;
          }

          row[per - 1] = { content: result, temp: isTemp };
        } else {
          row[per - 1] = { content: "", temp: isTemp };
        }
      }
    }

    await this.cacheService.setCachedTimetable(grade, klass, table);

    return table;
  }
}
