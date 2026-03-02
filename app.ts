import express from "express";
import identifyRoute from "./routes/identify.route";

const app = express();
app.use(express.json());
app.use(identifyRoute);

export default app;