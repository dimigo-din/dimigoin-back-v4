import cluster from "node:cluster";
import os from "node:os";

const numWorkers = parseInt(Bun.env.PM2_INSTANCES || "0", 10) || os.cpus().length;

async function bootstrap() {
  if (numWorkers > 1 && cluster.isPrimary) {
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork({ WORKER_INDEX: String(i) });
    }

    cluster.on("exit", (_worker, _code, _signal) => {
      cluster.fork();
    });
  } else {
    const { bootstrap } = await import("./main");
    const isFirstWorker = Bun.env.WORKER_INDEX === "0";
    await bootstrap(isFirstWorker);

    if (isFirstWorker) {
    }
  }
}

bootstrap();
