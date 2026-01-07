import * as path from "node:path";

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Observable } from "rxjs";

import { Allowed_Image_Extensions, Allowed_Image_Signatures } from "@/common/mapper/constants";
import { ErrorMsg } from "@/common/mapper/error";
import { FileDTO } from "../dto/facility.dto";

@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly uploadDir = path.join(process.cwd(), "uploads/facility");

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<FastifyRequest & { body: Record<string, unknown> }>();

    const files: FileDTO[] = [];

    if (req.isMultipart()) {
      const parts = req.parts();

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "file") {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          files.push({
            fieldname: part.fieldname,
            originalname: part.filename,
            encoding: part.encoding,
            mimetype: part.mimetype,
            buffer,
            size: buffer.length,
          });
        } else if (part.type === "field" && part.fieldname) {
          req.body[part.fieldname] = part.value;
        }
      }
    }

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      const isAllowedExt = Allowed_Image_Extensions.includes(ext);
      const isAllowedSig = Allowed_Image_Signatures.some((s) =>
        file.buffer.toString("hex", 0, 20).startsWith(s),
      );

      if (!isAllowedExt || !isAllowedSig) {
        throw new HttpException(ErrorMsg.Not_A_Valid_Image(), HttpStatus.BAD_REQUEST);
      }
    }

    for (const file of files) {
      const filename = Bun.randomUUIDv7();
      file.filename = filename;
      await Bun.write(path.join(this.uploadDir, filename), file.buffer, { createPath: true });
    }

    req.body.file = files;
    return next.handle();
  }
}
