import { Injectable, Logger } from "@nestjs/common";
import { ClusterDto, Deployment } from "$/dto";

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
    if (this.cluster) {
      return this.cluster;
    }

    const packageFile = await import(`${process.cwd()}/package.json`);
    const { name, version, description, author } = packageFile;

    const mode = (Bun.env.NODE_ENV as Deployment) || "prod";

    this.cluster = { name, version, description, author, mode };
    return this.cluster;
  }
}
