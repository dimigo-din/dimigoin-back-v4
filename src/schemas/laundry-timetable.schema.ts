import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
import { ApiProperty, ApiExtraModels, getSchemaPath } from "@nestjs/swagger";
import { HydratedDocument, Types } from "mongoose";

import { GradeValues, GenderValues, Grade, Gender } from "src/common";

import { Laundry } from "src/schemas";

export type LaundryTimetableDocument = HydratedDocument<LaundryTimetable>;

const options: SchemaOptions = {
  timestamps: false,
  versionKey: false,
  virtuals: true,
};

@ApiExtraModels(Laundry)
@Schema(options)
export class LaundryTimetable {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(Laundry) }],
  })
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: "Laundry",
  })
  laundry: Types.ObjectId;

  @ApiProperty()
  @Prop({
    required: true,
    type: [String],
  })
  sequence: string[];

  @ApiProperty()
  @Prop({
    required: true,
    type: [Number],
    enum: GradeValues,
  })
  grade: Grade;

  @ApiProperty()
  @Prop({
    required: true,
    type: String,
    enum: GenderValues,
  })
  gender: Gender;

  @ApiProperty()
  @Prop({
    required: true,
    type: Number,
    enum: [0, 1],
  })
  type: 0 | 1;
}

export const LaundryTimetableSchema =
  SchemaFactory.createForClass(LaundryTimetable);
