import { Injectable, Logger } from "@nestjs/common";
import { pick } from "lodash";
import type { ClusterDto, Deployment } from "src/common/dto";

@Injectable()
export class AppService {
  private cluster: ClusterDto;
  private readonly logger = new Logger(AppService.name);

  private DisplayMode = {
    dev: "Development Mode",
    test: "Test Mode",
    prod: "Production Mode",
    stg: "Stage Mode",
  };

  async onModuleInit() {
    await this.getBackendInfo();
    this.logger.log(`Package name: ${this.cluster.name}`);
    this.logger.log(`Package version: ${this.cluster.version}`);
    this.logger.log(`Package description: ${this.cluster.description}`);
    this.logger.log(`Package author: ${this.cluster.author}`);
    this.logger.log(`Cluster mode: ${this.DisplayMode[this.cluster.mode]}`);
  }

  async getBackendInfo(): Promise<ClusterDto> {
    if (this.cluster) return this.cluster;

    const packageFile = await import(`${process.cwd()}/package.json`);
    const packageInfo = pick(packageFile, ["name", "version", "description", "author"]);

    const mode = (process.env.NODE_ENV as Deployment) || "prod";

    this.cluster = { ...packageInfo, mode };
    return this.cluster;
  }
}
