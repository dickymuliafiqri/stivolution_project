/**
 * by dickymuliafiqri
 *
 * Used to broadcast message to all user
 */

import { bot, sqlite3 } from "..";

// RegExp
const broadcastRegExp: RegExp = /^[\/!.]broadcast (.+)/;

bot.snake.hears(broadcastRegExp, async (ctx) => {
    bot.wrapper(
        async () => {
            const match: any = ctx.text?.match(broadcastRegExp);
            const text: string = match[1];
            const db = await sqlite3.connect();

            const userIdList = await new Promise((resolve, reject) => {
                db?.all(`SELECT UserId from Users`, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            }).then((res) => {
                const userIdList: Array<number> = [];

                (res as Array<any>).forEach((user) => {
                    userIdList.push(user.UserID);
                });

                return userIdList;
            }).catch((err) => {
                throw err;
            }).finally(() => {
                sqlite3.close(db);
            });

            for (const userId of userIdList) {
                bot.snake.telegram.sendMessage(userId, text).catch((err) => {
                    bot.snake.client._log.error(err.message);
                });
            }
        },
        {
            context: ctx,
            adminOnly: true
        }
    );
});

let desc: string = "Kirimkan pesan ke semua pengguna bot\n";
desc += "\n<code>/broadcast PESAN_BROADCAST</code> -> Kirimkan pesan ke semua pengguna bot";

bot.addHelp("broadcast", desc);
