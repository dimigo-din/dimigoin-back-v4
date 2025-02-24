import { CustomConfigModule } from "./config.module";
import { CustomDatabaseModule } from "./database.module";
import { CustomJWTModule } from "./jwt.module";
import { CustomScheduleModule } from "./schedule.module";
import { ValidationModule } from "./validation.module";

export const CustomEssentialModules = [
  CustomConfigModule,
  CustomScheduleModule,
  CustomDatabaseModule,
  CustomJWTModule,
  ValidationModule,
];
