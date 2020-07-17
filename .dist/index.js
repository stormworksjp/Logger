"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
class Logger {
    constructor(o) {
        this.app = express_1.default();
        this.port = o.port;
    }
    start() {
        this._indexHandler();
        this.app.listen(this.port, () => console.log('ready'));
    }
    _indexHandler() {
        this.app.get('/', (req, res) => {
            console.log(req, res);
            return res.send('hello world!');
        });
    }
}
const logger = new Logger({ port: 3000 });
logger.start();
