import { CustomConfigTestModule } from "./config.module.test";
import { CustomDatabaseTestModule } from "./typeorm.module.test";

export const EssentialTestModules = [CustomConfigTestModule, CustomDatabaseTestModule];
