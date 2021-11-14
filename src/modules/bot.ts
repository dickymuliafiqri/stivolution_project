/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";
import speedTest from "speedtest-net";

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

bot.snake.command("speedtest", async (ctx) => {
    bot.wrapper(
        async () => {
            const outMsgId: number = await ctx
                .replyWithHTML("Memulai uji kecepatan!\n<i>harap tunggu...</i>")
                .then((res) => {
                    return res.id;
                });

            let finalText: string = "<b>Hasil Uji Kecepatan Internet</b>";
            finalText += "\n----------\n";

            await speedTest({
                acceptGdpr: true,
                acceptLicense: true
            }).then((res) => {
                finalText += `\n⎧-Server: ${res.server.name}`;
                finalText += `\n⎪\t└Country: ${res.server.country}`;
                finalText += `\n⎪\t└Location: ${res.server.location}`;
                finalText += `\n⎪-ISP: ${res.isp}`;
                finalText += `\n⎪\t└Ping: ${res.ping.latency} ms`;
                finalText += `\n⎪\t  └Download: ${(
                    res.download.bytes / 1000000
                ).toFixed(2)} MB`;
                finalText += `\n⎩\t  └Upload: ${(res.upload.bytes / 1000000).toFixed(
                    2
                )} MB`;
            });

            await bot.snake.telegram.editMessage(ctx.chat.id, outMsgId, finalText, {
                parseMode: "HTML"
            });
        },
        {
            context: ctx
        }
    );
});

let desc: string = "Cek status dan keadaan bot\n";
desc += "\n<code>/ping</code> -> Cek kecepatan respon";
desc += "\n<code>/alive</code> -> Lihat informasi bot";
desc += "\n<code>/speedtest</code> -> Uji kecepatan internet";

bot.addHelp("bot", desc);
