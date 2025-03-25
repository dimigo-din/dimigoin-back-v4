import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { StayService } from "../providers";

@ApiTags("Stay")
@Controller("/stay")
export class StayController {
  constructor(private readonly stayService: StayService) {}
}
