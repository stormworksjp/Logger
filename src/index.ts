import express from 'express';

class Logger {
  private app: express.Application;
  private port: number;

  constructor(o: { port: number }) {
    this.app = express();
    this.port = o.port;
  }

  start(): void {
    this._indexHandler();

    this.app.listen(this.port, () => console.log('ready'));
  }

  private _indexHandler(): void {
    this.app.get('/', (req: express.Request, res: express.Response) => {
      console.log(req, res);
      return res.send('hello world!');
    });
  }
}

const logger = new Logger({ port: 3000 });
logger.start();
