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

            let failedBroadcast: number = 0;
            let finalText: string = "<b>Mengirimkan Pesan Ke Semua Pengguna</b>";
            finalText += "\n----------\n";
            finalText += `\nPesan: <code>${text}</code>`;

            const buildFinalBroadcastText = (receiver: number) => {
                let broadcastText: string = `\nPenerima: ${receiver}`;
                broadcastText += `\nGagal: ${failedBroadcast}\n`;
                broadcastText +=
                    "\n<i>ID yang gagal menerima pesan akan dihapus dari daftar pengguna</i>";

                return `${finalText}${broadcastText}`;
            };

            const userIdList = await new Promise((resolve, reject) => {
                db?.all(`SELECT UserId from Users`, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            })
                .then((res) => {
                    const userIdList: Array<number> = [];

                    (res as Array<any>).forEach((user) => {
                        userIdList.push(user.UserID);
                    });

                    return userIdList;
                })
                .catch((err) => {
                    throw err;
                })
                .finally(() => {
                    sqlite3.close(db);
                });

            const outMsg = await bot.snake.client.sendMessage(ctx.chat.id, {
                message: buildFinalBroadcastText(userIdList.length),
                replyTo: ctx.id,
                parseMode: "html"
            });

            for (const userId of userIdList) {
                bot.snake.client
                    .sendMessage(userId, {
                        message: text,
                        parseMode: "html"
                    })
                    .catch((err) => {
                        failedBroadcast += 1;
                        if (err.message?.match("USER_IS_BLOCKED")) {
                            sqlite3.connect().then((db) => {
                                db?.run(
                                    `DELETE FROM Users WHERE UserID = ?`,
                                    [userId],
                                    (err) => {
                                        if (err) bot.snake.client._log.error(err.message);
                                        sqlite3.close(db);
                                    }
                                );
                            });
                        } else {
                            bot.snake.client._log.error(err.message);
                        }
                    })
                    .finally(async () => {
                        await bot.snake.client.editMessage(ctx.chat.id, {
                            message: outMsg,
                            text: buildFinalBroadcastText(userIdList.length),
                            parseMode: "html"
                        });
                    });
            }
        },
        {
            context: ctx,
            adminOnly: true
        }
    );
});

let desc: string = "Interaksi dengan pengguna bot\n";
desc += "\n<code>/broadcast PESAN_BROADCAST</code> -> Kirimkan pesan massal";

bot.addHelp("broadcast", desc);
