/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";
import { inlineKeyboardButton } from "tgsnake/lib/Utils/ReplyMarkup";

bot.snake.command("ping", async (ctx) => {
    bot.wrapper(
        async () => {
            // @ts-ignore
            await ctx.replyWithHTML(`🏓 pong\n\n${Date.now() - ctx.startTime} ms`);
        },
        {
            context: ctx
        }
    );
});

bot.snake.command("alive", async (ctx) => {
    bot.wrapper(
        async () => {
            let uptime: number = Number(si.time().uptime);
            let days: number = 0;
            let hours: number = 0;
            let minutes: number = 0;
            let seconds: number = 0;

            while (uptime > 0) {
                if (uptime >= 86400) {
                    ++days;
                    uptime -= 86400;
                } else if (uptime >= 3600) {
                    ++hours;
                    uptime -= 3600;
                } else if (uptime >= 60) {
                    ++minutes;
                    uptime -= 60;
                } else {
                    seconds = uptime;
                    uptime -= uptime;
                }
            }
            await ctx.telegram.sendPhoto(ctx.chat.id, bot.botImage, {
                caption: await bot
                    .buildBotInfo()
                    .then(
                        (res) =>
                            `${res}\n\n💡 Uptime ${days ? days + " hari " : ""}${
                                hours ? hours + " jam " : ""
                            }${minutes ? minutes + " menit " : ""} ${
                                seconds.toFixed() + " detik"
                            }`
                    ),
                parseMode: "HTML"
            });
        },
        {
            context: ctx
        }
    );
});

bot.snake.command("restart", async (ctx) => {
    bot.wrapper(
        async () => {
            let finalText: string = "<b>Mulai Ulang Bot</b>";
            finalText += "\n---------\n";
            finalText += "\n<i>Tekan tombol di bawah untuk memulai ulang</i>";
            let finalButton: Array<Array<inlineKeyboardButton>> = [
                [{ text: "Mulai Ulang", callbackData: "01/Restart" }]
            ];

            await ctx.replyWithHTML(finalText, {
                replyMarkup: {
                    inlineKeyboard: finalButton
                }
            });
        },
        {
            context: ctx,
            adminOnly: true
        }
    );
});

let desc: string = "Cek status dan keadaan bot/server\n";
desc += "\n<code>/ping</code> -> Cek kecepatan respon";
desc += "\n<code>/alive</code> -> Lihat informasi bot";
desc += "\n<code>/restart</code> -> Mulai ulang bot";

bot.addHelp("bot", desc);
