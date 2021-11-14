/**
 * by dickymuliafiqri
 *
 * Used to create connection with database
 */

import * as sqlite3 from "sqlite3";
import { existsSync, mkdirSync } from "fs";
import { sleep } from "telegram/Helpers";

const sql = sqlite3.verbose(); // Delete .verbose() on production

export class Database {
  private _sqlitePool: Array<sqlite3.Database> = [];

  /**
   *
   * @param connection Total connection will be stored at `Object Pool`. Default is 3
   */
  async make(connection: number = 3) {
    if (connection < 3) throw new Error("Minimum connection is 3");
    if (!existsSync("./db")) mkdirSync("./db");
    for (let i = 1; i <= connection; i++) {
      await new Promise((resolve) => {
        resolve(new sql.Database("./db/users.sqlite"));
      }).then((res) => {
        this._sqlitePool.push(res as sqlite3.Database);
      });
    }

    console.log(
      `🗄 Total database connection successfully created: ${this._sqlitePool.length}`
    );
  }

  /**
   *
   * @param retry Retry to get connection. 1 second each cycle. Default is 5 and cannot less than 1
   */
  async connect(retry: number = 5): Promise<sqlite3.Database | undefined> {
    if (retry) {
      if (this._sqlitePool.length) {
        return this._sqlitePool.shift();
      } else {
        await sleep(1000);
        return await this.connect(retry - 1).then((res) => {
          if (res) return res;
          else throw new Error("Connection to Database failed!");
        });
      }
    } else {
      return undefined;
    }
  }

  close(connection: sqlite3.Database | undefined) {
    if (connection) this._sqlitePool.push(connection);
  }
}
