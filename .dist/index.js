"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const loggerLibs = __importStar(require("./libs/logger-libs"));
const util_1 = require("util");
class Logger {
    constructor(o) {
        if (!o.port)
            throw new Error('ポート番号が入力されていません');
        this.app = express_1.default();
        this.loggerdb = new loggerLibs.DB('mongodb://localhost:27017', 'logger');
        this.port = parseInt(o.port);
    }
    start() {
        this._logMiddleware();
        this._indexRoute();
        this._generateKeyRoute();
        this._recordDataRoute();
        this._outputDataRoute();
        this.loggerdb.start();
        this.app.listen(this.port, () => console.log('ready'));
    }
    _logMiddleware() {
        this.app.use((req, res, next) => {
            console.log(req, res);
            next();
        });
    }
    _indexRoute() {
        this.app.get('/', (req, res) => {
            return res.send('hello world!');
        });
    }
    _generateKeyRoute() {
        this.app.get('/key', (req, res) => {
            return res.send('key');
        });
    }
    _recordDataRoute() {
        this.app.get('/record', (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.query.key || !util_1.isString(req.query.key))
                return res.status(400).send('require key');
            if (!req.query.data || !util_1.isString(req.query.data))
                return res.status(400).send('require data (csv format)');
            yield this.loggerdb
                .recordData(req.query.key, req.query.data)
                .then(() => {
                return res.send('ok');
            })
                .catch((err) => {
                console.error(err);
                return res.status(500).send('error');
            });
        }));
    }
    _outputDataRoute() {
        this.app.get('/data', (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.query.key || !util_1.isString(req.query.key))
                return res.status(400).send('require key');
            const data = this.loggerdb.findData(req.query.key);
            return res.send((yield data).map((o) => ({ data: o.data, timestamp: o.timestamp })));
        }));
    }
}
const logger = new Logger({ port: process.env.PORT });
logger.start();
