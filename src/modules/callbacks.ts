/**
 * by dickymuliafiqri
 *
 * Used to handle all bot callback queries
 */

import { bot, sqlite3 } from "..";
import { inlineKeyboardButton } from "tgsnake/lib/Utils/ReplyMarkup";
import { userDataList } from "../../core/Session";
import { default as axios } from "axios";
import { Api } from "telegram/tl";
import { exec, spawn } from "child_process";

bot.snake.on("UpdateBotCallbackQuery", async (ctx) => {
    let entities;
    let data;
    let userId: any;
    let chatId: any;
    let outMsg: any;
    bot.wrapper(
        async () => {
            // @ts-ignore
            entities = Object.fromEntries(ctx._entities);
            data = ctx.data?.toString() as string;
            userId = ctx.userId;
            chatId = entities[Object.keys(entities).at(-1) || userId].id;

            let finalText: string = "";
            let finalButton: Array<Array<inlineKeyboardButton>> = [[]];

            // Get message
            const message: any = await (async () => {
                return await bot.snake.telegram.getMessages(chatId, [ctx.msgId]);
            })();
            const replyToMessage: any = message.messages[0].replyToMessage;

      if (userId !== replyToMessage.from.id)
        return await bot.snake.client.invoke(
          new Api.messages.SetBotCallbackAnswer({
            queryId: ctx.queryId,
            message: "Mo ngapain bwang ? 👮🏻‍",
          })
        );

      if (data.startsWith("01")) {
        if (data.match(/Login$/)) {
          const db = await sqlite3.connect();
          const { Password, NIM } = userDataList[userId];

          // Check if user is already logged in on another device
          const user = await new Promise((resolve, reject) => {
            db?.get(`SELECT * FROM Users WHERE NIM = ?`, [NIM], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          }).catch((err) => {
            throw err;
          });

          if (!user) {
            await axios
              .post(bot.databaseApi, {
                id: NIM,
                pass: Password,
              })
              .then(async () => {
                await new Promise((resolve, reject) => {
                  db?.run(
                    `INSERT INTO Users VALUES(?, ?, ?)`,
                    [userId, NIM, Password],
                    (err) => {
                      if (err) reject(err);
                      else resolve("OK");
                    }
                  );
                })
                  .then(() => {
                    finalText = `Yeyy, kamu berhasil login dengan NIM ${NIM}`;
                    delete userDataList[userId];
                  })
                  .catch((err) => {
                    throw err;
                  });
              })
              .catch((err) => {
                if (err.response) {
                  if (err.response.status === 401) {
                    userDataList[userId].Session = "NIM";

                    finalText = "<b>Password/NIM salah</b>";
                    finalText += "\n----------\n";
                    finalText +=
                      "\n<i>coba kirim lagi NIM dan Password kamu atau tekan tombol di bawah untuk membatalkan.</i>";

                    finalButton[0][0] = {
                      text: "Batal",
                      callbackData: "01/LoginCancel",
                    };
                  } else {
                    throw err;
                  }
                } else {
                  throw err;
                }
              });
          } else {
            delete userDataList[userId];
            finalText = `NIM ${NIM} sudah digunakan di perangkat lain`;
          }

          await bot.snake.telegram
            .editMessage(chatId, ctx.msgId, finalText, {
              replyMarkup: finalButton[0][0]
                ? {
                    inlineKeyboard: finalButton,
                  }
                : undefined,
              parseMode: "HTML",
            })
            .then(() => {
              finalText = "";
            });

          sqlite3.close(db);
        } else if (data.match(/LoginCancel$/)) {
          if (userDataList[userId]) delete userDataList[userId];

          finalText = "Login dibatalkan";
          await bot.snake.client.deleteMessages(chatId, [ctx.msgId], {
            revoke: true,
          });
        } else if (data.match(/Logout$/)) {
            const db = await sqlite3.connect();

            await new Promise((resolve, reject) => {
                db?.run(`DELETE FROM Users WHERE UserID = ?`, [userId], (err) => {
                    if (err) reject(err);
                    else resolve("OK");
                });
            })
                .then(() => {
                    finalText = "Berhasil logout";
                })
                .catch((err) => {
                    throw err;
                })
                .finally(() => {
                    sqlite3.close(db);
                });
            await bot.snake.client.deleteMessages(chatId, [ctx.msgId], {
                revoke: true
            });
        } else if (data.match(/Restart/)) {
            await bot.snake.telegram.editMessage(chatId, ctx.msgId, message.text);

            // Send initial message and delete modules
            await bot.snake.telegram
                .sendMessage(chatId, "Cleaning modules...")
                .then((res) => {
                    outMsg = res.message || res;
                    exec("rm -rf app/src/modules");
                });

            // Recompile code
            await bot.snake.telegram.editMessage(
                chatId,
                outMsg.id,
                "Compiling code..."
            );
            const compile = spawn("npx", ["tsc"]);

            // Restart the bot
            compile.on("close", async () => {
                await bot.snake.telegram
                    .editMessage(chatId, outMsg.id, "Restarting bot...")
                    .then(() => {
                        exec("pm2 restart Stivolution");
                    });
            });
        } else if (data.match(/Update$/)) {
            // Pull from remote/origin
            const pull = async () => {
                await bot.git.pull("origin", bot.branch).then((res) => {
                    finalText = `<b>Pembaruan ${bot.branch} berhasil</b>`;
                    finalText += "\n----------\n";

                    finalText += "\nRangkuman";
                    finalText += `\n- Perubahan: ${res.summary.changes}`;
                    finalText += `\n- Penghapusan: ${res.summary.deletions}`;
                    finalText += `\n- Penambahan: ${res.summary.insertions}`;
                    finalText +=
                        "\n\n<i>Tekan tombol di bawah untuk memulai ulang</i>";

                    finalButton[0][0] = {
                        text: "Mulai Ulang",
                        callbackData: "01/Restart"
                    };
                });
            };

            // Clean local repo before pulling from upstream
            await bot.git.clean("f", ["-d"]);

            // Reset workspace if conflict happens
            await pull().catch(async (err: any) => {
                if (err.message.match("Auto-merging")) {
                    await bot.git.reset(["--hard", bot.branch]);
                    await pull();
                } else {
                    throw err;
                }
            });

            await bot.snake.telegram.editMessage(chatId, ctx.msgId, message.text);
            await bot.snake.telegram
                .sendMessage(chatId, finalText, {
                    parseMode: "HTML",
                    replyToMsgId: replyToMessage.id,
                    replyMarkup: finalButton[0][0]
                        ? {
                            inlineKeyboard: finalButton
                        }
                        : undefined
                })
                .then(() => {
                    finalText = "";
                });
        } else if (data.match(/ChangeBranch .+/)) {
            const selBranch: string = data.split(" ")[1];
            bot.branch = selBranch;

            // Checkout branch
            await bot.git.checkout(["-B", selBranch]);

            finalText = `Berhasil berganti branch ke ${selBranch}`;
            let finalButton: Array<Array<inlineKeyboardButton>> = [
                [
                    {
                        text: "Update",
                        callbackData: "01/Update"
                    }
                ]
            ];

            await bot.snake.telegram.editMessage(
                chatId,
                ctx.msgId,
                finalText + "\n\n<i>Lakukan update untuk menerapkan branch</i>",
            {
              parseMode: "HTML",
              replyMarkup: {
                inlineKeyboard: finalButton,
              },
            }
          );
        }

        if (finalText) {
          await bot.snake.client.invoke(
            new Api.messages.SetBotCallbackAnswer({
              queryId: ctx.queryId,
              message: finalText,
            })
          );
        }
      }
    },
        {
            context: { ...ctx, chat: { id: chatId } },
            skipSessionCheck: true
        }
  );
});
