import express from "express";
import db from "../database/connection";

const Router = express.Router();

Router.get("/", (req, res) => {
  res.send({
    status: 200,
    message: "Welcome to LendsQr BE Assessment API",
  });
});

Router.get("/health", async (req, res) => {
  try {
    await db.raw("SELECT 1+1 AS result");
    res.json({ status: "ok", db: "connected" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err });
  }
});

Router.use(function (req, res, next) {
  res
    .status(404)
    .send({ responseCode: 404, message: "Invalid resource URL", data: [] });
  next();
});

export default Router;
