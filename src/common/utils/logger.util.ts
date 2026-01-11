import { ConsoleLogger } from "@nestjs/common";

const INIT_CONTEXTS = [
  "AppService",
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
  "NestFactory",
  "NestApplication",
  "ValidationModule",
  "CustomSwaggerSetup",
];

export class ClusterLogger extends ConsoleLogger {
  private isInit: boolean;

  constructor(isInit = true) {
    super();
    this.isInit = isInit;
  }

  override log(message: unknown, context?: string) {
    if (!this.isInit && INIT_CONTEXTS.includes(context || "")) {
      return;
    }
    super.log(message, context);
  }
}
