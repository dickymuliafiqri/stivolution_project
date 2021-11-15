/**
 * by dickymuliafiqri
 *
 * Speedtest module, how fast is your speed...
 */

import { bot } from "../index";
import speedTest from "speedtest-net";

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
                finalText += `\n⎪\t  └Upload: ${(res.upload.bytes / 1000000).toFixed(
                    2
                )} MB`;
                finalText += `\n⎩-Result: <a href="${res.result.url}">URL</a>`;
            });

            if (outMsgId) {
                await bot.snake.telegram.editMessage(ctx.chat.id, outMsgId, finalText, {
                    parseMode: "HTML"
                });
            } else {
                await ctx.replyWithHTML(finalText, {
                    parseMode: "HTML"
                });
            }
        },
        {
            context: ctx
        }
    );
});

let desc: string = "Uji kecepatan internet bot\n";

bot.addHelp("speedtest", desc);