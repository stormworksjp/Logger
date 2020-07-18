require('dotenv').config();

import express from 'express';
import * as loggerLibs from './libs/logger-libs';
import { isString } from 'util';

class Logger {
  private loggerdb: loggerLibs.DB;
  private app: express.Application;
  private port: number;

  constructor(o: { port: string | undefined }) {
    if (!o.port) throw new Error('ポート番号が入力されていません');

    this.app = express();
    this.loggerdb = new loggerLibs.DB('mongodb://localhost:27017', 'logger');

    this.port = parseInt(o.port);
  }

  start(): void {
    this._logMiddleware();

    this._indexRoute();
    this._generateKeyRoute();
    this._recordDataRoute();
    this._outputDataRoute();

    this.loggerdb.start();

    this.app.listen(this.port, () => console.log('ready'));
  }

  private _logMiddleware(): void {
    this.app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.log(req, res);
        next();
      }
    );
  }
  private _indexRoute(): void {
    this.app.get('/', (req: express.Request, res: express.Response) => {
      return res.send('hello world!');
    });
  }

  private _generateKeyRoute(): void {
    this.app.get('/key', (req: express.Request, res: express.Response) => {
      return res.send('key');
    });
  }

  private _recordDataRoute(): void {
    this.app.get(
      '/record',
      async (req: express.Request, res: express.Response) => {
        if (!req.query.key || !isString(req.query.key))
          return res.status(400).send('require key');
        if (!req.query.data || !isString(req.query.data))
          return res.status(400).send('require data (csv format)');

        await this.loggerdb
          .recordData(req.query.key, req.query.data)
          .then(() => {
            return res.send('ok');
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).send('error');
          });
      }
    );
  }

  private _outputDataRoute(): void {
    this.app.get(
      '/data',
      async (req: express.Request, res: express.Response) => {
        if (!req.query.key || !isString(req.query.key))
          return res.status(400).send('require key');

        const data = this.loggerdb.findData(req.query.key);
        return res.send(
          (await data).map((o) => ({ data: o.data, timestamp: o.timestamp }))
        );
      }
    );
  }
}

const logger = new Logger({ port: process.env.PORT });
logger.start();
