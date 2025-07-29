import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class UserService {
  constructor() {}

  async getTimeTable(grade: number, klass: number, opts: any = {}) {
    const rawData = (await axios.get("http://comci.net:4082/36179?NzM2MjlfMjkxNzVfMF8x")).data;
    const data = JSON.parse(rawData.substring(0, rawData.lastIndexOf("}") + 1));

    const DIV = data["분리"] ?? 100; // division value (100 or 1000)
    const subjects = data["자료492"]; // subject array
    const teachers = data.자료446; // teacher array
    const MAX_P = 8; // 1~8 periods
    const MAX_D = 5; // Mon~Fri

    const table = Array.from({ length: MAX_D }, () =>
      Array(MAX_P)
        .fill(null)
        .map(() => ({ content: "", temp: false })),
    );

    // Implementation of original mTh, mSb, mTime functions
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
        return String.fromCharCode(n) + "_";
      }
      return "";
    };

    // Q자료 function: undefined check
    const safeData = (m: any) => {
      if (m === undefined) {
        return 0;
      } else {
        return m;
      }
    };

    const getGroupCode = (
      dataObj: any,
      gradeNum: number,
      classNum: number,
      subjectCode: number,
      dayOfWeek: number,
      period: number,
    ) => {
      const division = dataObj["분리"] ?? 100;

      if (!Array.isArray(dataObj["동시그룹"])) {
        return "";
      }

      for (let i = 1; i <= dataObj["동시그룹"][0][0]; i++) {
        for (let k = 1; k <= 2; k++) {
          let check = 0;
          let currentGroup = 0;

          for (let j = 1; j <= dataObj["동시그룹"][i][0]; j++) {
            const subject4 = Math.floor(dataObj["동시그룹"][i][j] / 1000);
            const group2 = Math.floor(subject4 / 1000);
            const subject2 = subject4 - group2 * 1000;
            const teacher = Math.floor(group2 / 100);
            const group = group2 - teacher * 100;
            const classroom = dataObj["동시그룹"][i][j] - subject4 * 1000;
            const grade2 = Math.floor(classroom / 100);
            const class2 = classroom - grade2 * 100;
            const subject3 = Math.floor(
              dataObj["자료147"][grade2][class2][dayOfWeek][period] / division,
            );
            const teacher2 =
              dataObj["자료147"][grade2][class2][dayOfWeek][period] - subject3 * division;

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
            return String.fromCharCode(n2) + "_";
          }
        }
      }
      return "";
    };

    for (let day = 1; day <= MAX_D; day++) {
      for (let per = 1; per <= MAX_P; per++) {
        const originalData = safeData(
          (((data["자료481"][grade] || [])[klass] || [])[day] || [])[per],
        );
        const dailyData = safeData((((data["자료147"][grade] || [])[klass] || [])[day] || [])[per]);

        let classroom = "";
        if (data.강의실 === 1) {
          const roomInfo = (((data.자료245[grade] || [])[klass] || [])[day] || [])[per];
          if (roomInfo !== undefined && roomInfo.indexOf("_") > 0) {
            const roomParts = roomInfo.split("_");
            const roomNumber = Number(roomParts[0]);
            classroom = roomParts[1];
            if (roomNumber > 0) {
              classroom = "\n" + classroom;
            } else {
              classroom = "";
            }
          }
        }

        const isTemp = originalData !== dailyData;

        if (dailyData > 100) {
          let teacherName = "";
          let groupPrefix = "";
          let timePrefix = "";

          const teacherIndex = mTh(dailyData, DIV);
          let subjectIndex = mSb(dailyData, DIV);
          timePrefix = mTime(subjectIndex, DIV);
          subjectIndex = subjectIndex % DIV;

          if (teacherIndex < data.자료446.length) {
            teacherName = data.자료446[teacherIndex].substr(0, 2);
          }

          if (timePrefix === "") {
            groupPrefix = getGroupCode(data, grade, klass, subjectIndex, day, per);
          } else {
            groupPrefix = timePrefix;
          }

          const subject = data["자료492"][subjectIndex] || "";
          const teacher = teacherName;

          let result = groupPrefix + subject;
          if (teacher) {
            result += "\n" + teacher;
          }
          if (classroom) {
            result += classroom;
          }

          table[day - 1][per - 1] = { content: result, temp: isTemp };
        } else {
          table[day - 1][per - 1] = { content: "", temp: isTemp };
        }
      }
    }

    return table;
  }
}
