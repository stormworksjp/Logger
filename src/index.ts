import dotenv from 'dotenv';
dotenv.config();

import path from 'path';

import moment from 'moment';
import Discord from 'discord.js';
import cron from 'node-cron';

import express from 'express';
import * as loggerLibs from './libs/logger-libs';
import { isString } from 'util';

class Logger {
  private bot: Discord.Client;
  private token: string;

  private channelId: string;
  private channel?: Discord.Channel;
  private previousCount: number;

  private loggerdb: loggerLibs.DB;
  private app: express.Application;
  private port: number;

  constructor(o: {
    port: string | undefined;
    discordToken: string | undefined;
    channelId: string | undefined;
  }) {
    if (!o.port) throw new Error('ポート番号が入力されていません');
    if (!o.discordToken) throw new Error('トークンが入力されていません');
    if (!o.channelId) throw new Error('チャンネルIDが入力されていません');

    this.bot = new Discord.Client();
    this.token = o.discordToken;

    this.channelId = o.channelId;
    this.previousCount = 0;

    this.app = express();
    this.loggerdb = new loggerLibs.DB('mongodb://localhost:27017', 'logger');

    this.port = parseInt(o.port);
  }

  start(): void {
    // this._logMiddleware();

    this._indexRoute();
    this._generateKeyRoute();
    this._recordDataRoute();
    this._outputDataRoute();

    this.loggerdb.start();

    this.bot.login(this.token);
    this.app.listen(this.port, () => console.log('ready'));

    this._readyHandler();
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

  private _readyHandler(): void {
    this.bot.on('ready', () => {
      this._fetchChannel();
      this._reportDatabase();
      this._cronSchedule();
    });
  }

  private _fetchChannel(): void {
    const channel = this.bot.channels.cache.get(this.channelId);
    if (!channel) throw new Error('チャンネルIDが無効です');

    this.channel = channel;
  }

  private async _reportDatabase(): Promise<void> {
    if (!this.channel) return;
    if (!(this.channel instanceof Discord.TextChannel))
      throw new Error('チャンネル指定が不正です');

    const allDatas = await this.loggerdb.countData({});
    const activeDatas = this.loggerdb.countData({
      timestamp: { $gte: moment().subtract(1, 'd').unix() },
    });
    const deltaCount = allDatas - this.previousCount;
    this.previousCount = allDatas;

    this.channel.send({
      content: '現在のロガーシステムの状態を通知します。',
      embed: {
        title: 'ロガーシステムステータス',
        fields: [
          {
            name: '更新日時',
            value: moment().format('YYYY/MM/DD HH:mm:ss'),
            inline: true,
          },
          {
            name: 'データベース登録数',
            value: allDatas,
            inline: true,
          },
          { name: '前回からの増加量', value: deltaCount, inline: true },
          { name: '有効なデータ', value: await activeDatas, inline: true },
        ],
        color: parseInt(
          deltaCount >= 60 * 10
            ? '0xff0000'
            : deltaCount >= 60 * 5
            ? '0xff8800'
            : deltaCount >= 60 * 2.5
            ? '0xff00ff'
            : deltaCount >= 60
            ? '0x00ffff'
            : '0x222222'
        ),
      },
    });
  }

  private _cronSchedule(): void {
    cron.schedule('* */10 * * *', () => this._reportDatabase());
  }

  private _indexRoute(): void {
    this.app.get('/', (req: express.Request, res: express.Response) => {
      return res.sendFile(path.resolve('assets/index.html'));
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
        if (!req.query.format) return res.status(400).send('require format');
        const format = req.query.format;

        const data = await this.loggerdb.findData(req.query.key);
        const formated =
          format === 'json'
            ? data.map((o) => ({
                data: o.data,
                timestamp: o.timestamp,
              }))
            : format === 'csv'
            ? data.map((o) => `${o.timestamp},${o.data}`).join('\n')
            : 'unsupported';
        return res.send(formated);
      }
    );
  }
}

const logger = new Logger({
  port: process.env.PORT,
  discordToken: process.env.DISCORD_TOKEN,
  channelId: process.env.DISCORD_CHANNELID,
});
logger.start();
