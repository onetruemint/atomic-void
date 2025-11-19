import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";

export interface AtomicVoidOptions {
  appName: string;
  openApiSpec?: string;
}

export function atomicVoidApp(props: AtomicVoidOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
}
