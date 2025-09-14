import app from "./app";
import config from "./config/index";
import { checkDbConnection } from "./utils/dbHealth";

/* SERVER */
async function startServer() {
  const isDbConnected = await checkDbConnection();

  if (!isDbConnected) {
    console.error("Exiting: Database not available.");
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`API running at ${config.baseUrl}:${config.port}`);
  });
}

startServer();
