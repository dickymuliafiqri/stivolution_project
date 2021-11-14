/**
 * by dickymuliafiqri
 *
 * Used to auth user
 */

import { bot, sqlite3 } from "..";
import { userDataList } from "../../core/Session";
import { inlineKeyboardButton } from "tgsnake/lib/Utils/ReplyMarkup";

bot.snake.command("login", async (ctx) => {
  bot.wrapper(
    async () => {
      const userId = ctx.from.id;
      const db = await sqlite3.connect();

      let finalText: string;
      let finalButton: Array<Array<inlineKeyboardButton>> = [[]];

      if (!ctx.chat?.private) {
        return await ctx.replyWithHTML(
          "Hanya bisa login di chat/obrolan pribadi"
        );
      }

      const User: any = await new Promise((resolve, reject) => {
        db?.get(
          `SELECT * FROM Users WHERE UserID = ?`,
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (User) {
        finalText = `Kamu sudah login dengan NIM ${User?.NIM}`;
        finalText +=
          "\n\nUntuk keluar (logout), tekan tombol di bawah atau kirim perintah <code>/logout</code>";

        finalButton = [
          [
            {
              text: "Logout",
              callbackData: "01/Logout",
            },
          ],
        ];
      } else {
        userDataList[userId] = {
          Session: "NIM",
        };

        finalText = "Untuk login, silahkan kirim NIM kamu";
      }

      await ctx.replyWithHTML(finalText, {
        replyMarkup: finalButton[0][0]
          ? {
              inlineKeyboard: finalButton,
            }
          : undefined,
      });

      sqlite3.close(db);
    },
    {
      context: ctx,
    }
  );
});

bot.snake.command("logout", async (ctx) => {
  bot.wrapper(
    async () => {
      const db = await sqlite3.connect();
      const userId = ctx.from.id;

      let finalText: string;

      const user = await new Promise((resolve, reject) => {
        db?.get(
          `SELECT * FROM Users WHERE UserID = ?`,
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (user) {
        await new Promise((resolve, reject) => {
          db?.run(`DELETE FROM Users WHERE UserID = ?`, [userId], (err) => {
            if (err) reject(err);
            else resolve("OK");
          });
        });

        finalText = "logout berhasil";
      } else {
        finalText = "Kamu belum login";
      }

      await ctx.replyWithHTML(finalText);

      sqlite3.close(db);
    },
    {
      context: ctx,
    }
  );
});

bot.snake.on("message", async (ctx) => {
  bot.wrapper(
    async () => {
      const userId = ctx.from.id;
      const sessions = ["NIM", "Password"];

      if (!sessions.includes(userDataList[userId]?.Session as string)) return;
      if (!ctx.chat?.private) {
        return await ctx.replyWithHTML(
          "Hanya bisa mengisi data login di chat/obrolan pribadi"
        );
      }

      let finalText: string = "";
      let finalButton: Array<Array<inlineKeyboardButton>> = [[]];

      switch (userDataList[userId].Session) {
        case "NIM":
          if (
            isNaN(parseInt(ctx.text as string)) ||
            (ctx.text as string).length < 10
          ) {
            finalText = "Masukkan NIM kamu dengan benar!";
          } else {
            userDataList[userId].NIM = Number(ctx.text);
            userDataList[userId].Session = "Password";

            finalText = "OK, kalo passwordnya apa ?";
            finalText += "\nIni password yang dipake login di FRS";
          }
          break;

        case "Password":
          userDataList[userId].Password = ctx.text as string;
          userDataList[userId].Session = "Login";

        case "Login":
          const { Password, NIM } = userDataList[userId];

          finalText = "Konfirmasi Login";
          finalText += "\n----------\n";
          finalText += `\nKamu akan login dengan data berikut:`;
          finalText += `\nNIM: <code>${NIM}</code>`;
          finalText += `\nPassword: <code>${Password}</code>`;

          finalButton[0] = [
            {
              text: "Batal",
              callbackData: "01/LoginCancel",
            },
            {
              text: "Login",
              callbackData: "01/Login",
            },
          ];

          break;
      }

      await ctx.replyWithHTML(finalText, {
        replyMarkup: finalButton[0][0]
          ? {
              inlineKeyboard: finalButton,
            }
          : undefined,
      });
    },
    {
      context: ctx,
      skipSessionCheck: true,
    }
  );
});

let desc: string = "Autentikasi user\n";
desc += "\n<code>/login</code> -> Login ke layanan FRS";
desc += "\n<code>/logout</code> -> Logout";

bot.addHelp("auth", desc);
