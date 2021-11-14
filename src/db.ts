import { Database } from "../core/Database";

export const sqlite3 = new Database();

// Initialize, make connection, and create Users table if not exists
export async function initDB() {
  await sqlite3.make().then(async () => {
    const db = await sqlite3.connect();

    await new Promise((resolve, reject) => {
      // Create table unique index
      const createIndex = () => {
        db?.run(
          `CREATE UNIQUE INDEX Users_UserID_uindex ON Users (UserID);`,
          (err) => {
            if (err) reject(err);
            else resolve("Table created!");
          }
        );
      };

      // Create table
      const createTable = () => {
        db?.run(
          `CREATE TABLE Users (
            UserID INTEGER NOT NULL
                CONSTRAINT Users_pk
                    PRIMARY KEY,
            NIM INTEGER,
            Password VARCHAR(16)
            );`,
          (err) => {
            if (err) reject(err);
            else createIndex();
          }
        );
      };

      // Check if table already exists or not
      // Create one if not
      db?.get(
        `SELECT name FROM sqlite_master WHERE type="table" AND name="Users";`,
        (err, row) => {
          if (err) reject(err);
          else row?.name ? resolve("Table exists!") : createTable();
        }
      );
    })
      .then((res) => {
        if (String(res).includes("created"))
          console.log("Users table created!");
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        sqlite3.close(db);
      });
  });
}
