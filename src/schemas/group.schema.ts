import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GroupDocument = Group & Document;

const options: SchemaOptions = {
  timestamps: false,
  versionKey: false,
};

@Schema(options)
export class Group {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
    type: [String],
    default: [],
  })
  permissions: [];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
