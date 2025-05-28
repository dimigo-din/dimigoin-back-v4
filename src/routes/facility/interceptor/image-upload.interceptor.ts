import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Observable } from "rxjs";

import {
  Allowed_Image_Extensions,
  Allowed_Image_Signatures,
} from "../../../common/mapper/constants";
import { ErrorMsg } from "../../../common/mapper/error";

@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private fileInterceptor: NestInterceptor;

  constructor() {
    const FileInterceptor = FileFieldsInterceptor([{ name: "file", maxCount: 5 }], {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    });

    this.fileInterceptor = new FileInterceptor();
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    await this.fileInterceptor.intercept(context, next);

    const files: Express.Multer.File[] = req.files?.file || [];

    let malicious = true;
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();

      if (Allowed_Image_Extensions.includes(ext)) malicious = false;
      if (Allowed_Image_Signatures.some((s) => file.buffer.toString("hex", 0, 20).startsWith(s)))
        malicious = false;
    }

    if (malicious) {
      for (const file of files) {
        delete file.buffer;
      }
      throw new HttpException(ErrorMsg.Not_A_Valid_Image(), HttpStatus.BAD_REQUEST);
    }

    for (const file of files) {
      const filename = crypto.randomBytes(32).toString("hex");
      file.filename = filename;
      if (!fs.existsSync(path.join(__dirname, "../upload")))
        fs.mkdirSync(path.join(__dirname, "../upload"));
      fs.writeFileSync(path.join(__dirname, "../upload", filename), file.buffer);
    }

    return next.handle();
  }
}
