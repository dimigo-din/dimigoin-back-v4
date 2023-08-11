import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Place, PlaceGroup } from 'src/common/schemas';
import { PlaceService } from './place.service';
import { CreatePlaceDto, CreatePlaceGroupDto } from 'src/common/dto';

@Controller('place')
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  // Place
  @Get()
  async getAllPlace(): Promise<any> {
    return this.placeService.getAllPlace();
  }

  @Post()
  async createPlace(@Body() data: CreatePlaceDto): Promise<Place> {
    return this.placeService.createPlace(data);
  }

  // PlaceGroup
  @Get('/group/:id')
  async getPlacesByGroup(@Param('id') groupId: string): Promise<Place[]> {
    return this.placeService.getPlacesByGroup(groupId);
  }

  @Patch('/group/:id')
  async managePlaceGroup(@Param('id') groupId: string, @Body() data: CreatePlaceGroupDto): Promise<PlaceGroup> {
    return this.placeService.managePlaceGroup(groupId, data);
  }

  @Post('/group')
  async createPlaceGroup(@Body() data: CreatePlaceGroupDto): Promise<PlaceGroup> {
    return this.placeService.createPlaceGroup(data);
  }
}