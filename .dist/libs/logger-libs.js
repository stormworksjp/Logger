"use strict";
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
exports.DB = void 0;
const mongodb_1 = __importDefault(require("mongodb"));
const moment_1 = __importDefault(require("moment"));
class DB {
    /**
     * Database settings.
     * @param dbUri database connection query. e.g. mongodb://localhost:27017
     * @param dbName database name.
     */
    constructor(dbUri, dbName) {
        this.dbUri = dbUri;
        this.dbName = dbName;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield mongodb_1.default.MongoClient.connect(this.dbUri, {
                useUnifiedTopology: true,
            })
                .then((mongo) => {
                this.db = mongo.db(this.dbName);
                return;
            })
                .catch((err) => {
                throw err;
            });
        });
    }
    recordData(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db
                .collection('data')
                .insertOne({ key, data, timestamp: moment_1.default().unix() })
                .catch((err) => {
                throw err;
            });
        });
    }
    findData(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db
                .collection('data')
                .find({ key })
                .sort({ timestamp: 1 })
                .toArray()
                .catch((err) => {
                throw err;
            });
        });
    }
}
exports.DB = DB;
