/**
 * by dickymuliafiqri
 *
 * Used to deal with files
 */

import { bot } from "..";
import { existsSync, lstatSync } from "fs";

// RegExp
const upRegExp: RegExp = /^[\/!.]up (.+)/;

let progressText = (progress: number) => {
    const progressBar = Number((progress * 10).toFixed());
    let bar: string = "";
    for (let i = 0; i < 10; i++) {
        if (i < progressBar) {
            bar += "∙";
        } else if (i === progressBar) {
            bar += progressBar % 2 ? "c" : "C";
        } else {
            bar += "•";
        }
    }
    return `Progress: [${progressBar >= 10 ? "FINISH" : bar}] ${progress * 100}%`;
};

bot.snake.hears(upRegExp, async (ctx) => {
    bot.wrapper(
        async () => {
            const match: any = ctx.text?.match(upRegExp);
            const filePath: string = `${bot.projectDir}/${match[1]}`;
            let outMsg: any;

            // Filter
            if (!existsSync(filePath))
                return ctx.replyWithHTML(`<i>${filePath} tidak ditemukan</i>`);
            const fileStat = lstatSync(filePath);
            if (fileStat.isDirectory())
                return ctx.replyWithHTML(`<i>${filePath} adalah sebuah folder</i>`);

            let finalText: string = `<b>Mengunggah Berkas</b>`;
            finalText += "\n----------\n";
            finalText += `\nFile: <code>${match[1].split("/").at(-1)}</code>`;

            await ctx
                .replyWithHTML(`${finalText}\n${progressText(0)}`)
                .then((res) => {
                    outMsg = res.message || res;
                });

            await bot.snake.client.sendFile(ctx.chat.id, {
                file: filePath,
                replyTo: ctx.id,
                progressCallback: async (progress) => {
                    await bot.snake.telegram.editMessage(
                        ctx.chat.id,
                        outMsg.id,
                        `${finalText}\n${progressText(progress)}`,
                        {
                            parseMode: "HTML",
                            noWebpage: true
                        }
                    );
                }
            });
        },
        {
            context: ctx
        }
    );
});

let desc: string = "Ambil data!\n";
desc += "\n<code>/up FILE</code> -> Ambil berkas dari server";

bot.addHelp("files", desc);
