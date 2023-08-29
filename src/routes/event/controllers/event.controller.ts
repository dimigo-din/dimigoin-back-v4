import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { EditPermissionGuard } from "src/auth/guards";
import { EventDocument, StudentDocument } from "src/schemas";
import { StayService } from "../../stay/providers/stay.service";
import { EventService } from "../providers/event.service";
import { AuthGuard } from "@nestjs/passport";

@Controller("event")
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly stayService: StayService,
  ) {}

  @Get()
  async getEvent(@Req() req: Request): Promise<{
    events: EventDocument[];
    type: number;
  }> {
    const user = req.user as StudentDocument;
    return {
      events: await this.eventService.getEvent(user.grade),
      type: await this.stayService.isStay(new Date()),
    };
  }

  @UseGuards(AuthGuard("jwt"), EditPermissionGuard)
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadEvent(@UploadedFile() file: Express.Multer.File): Promise<any> {
    return await this.eventService.uploadEvent(file);
  }

  @Get("type")
  async isStay(): Promise<number> {
    return await this.stayService.isStay(new Date());
  }
}
