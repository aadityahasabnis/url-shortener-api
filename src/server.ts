import Fastify from "fastify";
import { buildApp } from "./app";

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({
      port: Number(process.env.PORT ?? 3000),
      host: "0.0.0.0",
    });

    app.log.info("Server running");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();