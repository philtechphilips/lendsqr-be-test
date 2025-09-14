import app from "./app";
import config from "./config/index";

/* SERVER */
app.listen(config.port, () => {
  console.log(`API running on ${config.baseUrl}:${config.port}`);
});
