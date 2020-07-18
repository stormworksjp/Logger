import Mongo from 'mongodb';
import moment from 'moment';

export class DB {
  private db!: Mongo.Db;

  private dbUri: string;
  private dbName: string;

  /**
   * Database settings.
   * @param dbUri database connection query. e.g. mongodb://localhost:27017
   * @param dbName database name.
   */
  constructor(dbUri: string, dbName: string) {
    this.dbUri = dbUri;
    this.dbName = dbName;
  }

  public async start(): Promise<void> {
    await Mongo.MongoClient.connect(this.dbUri, {
      useUnifiedTopology: true,
    })
      .then((mongo) => {
        this.db = mongo.db(this.dbName);
        return;
      })
      .catch((err) => {
        throw err;
      });
  }

  public async recordData(key: string, data: string): Promise<void> {
    this.db
      .collection('data')
      .insertOne({ key, data, timestamp: moment().unix() })
      .catch((err) => {
        throw err;
      });
  }

  public async findData(key: string): Promise<any[]> {
    return this.db
      .collection('data')
      .find({ key, timestamp: { $gte: moment().subtract(1, 'd').unix() } })
      .sort({ timestamp: 1 })
      .toArray()
      .catch((err) => {
        throw err;
      });
  }
}
