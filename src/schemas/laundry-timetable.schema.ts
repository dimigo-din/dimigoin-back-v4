import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { GradeValues, GenderValues, Grade, Gender } from "src/common";

export type LaundryTimetableDocument = LaundryTimetable & Document;

const options: SchemaOptions = {
  timestamps: false,
  versionKey: false,
};

@Schema(options)
export class LaundryTimetable {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: "Laundry",
  })
  laundry: Types.ObjectId;

  @Prop({
    required: true,
    type: [String],
  })
  sequence: string[];

  @Prop({
    required: true,
    type: [Number],
    enum: GradeValues,
  })
  grade: Grade;

  @Prop({
    required: true,
    type: String,
    enum: GenderValues,
  })
  gender: Gender;

  @Prop({
    required: true,
    type: Number,
    enum: [0, 1],
  })
  type: 0 | 1;
}

export const LaundryTimetableSchema =
  SchemaFactory.createForClass(LaundryTimetable);
