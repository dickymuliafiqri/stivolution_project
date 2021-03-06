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
            bar += "-";
        } else if (i === progressBar) {
            bar += progressBar % 2 ? "c" : "C";
        } else {
            bar += i % 2 ? " " : "•";
        }
    }
    return `Progress: [${progressBar >= 10 ? "<b>FINISH</b>" : bar}] ${(
        progress * 100
    ).toFixed(2)}%`;
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
            finalText += `\nName: <code>${match[1].split("/").at(-1)}</code>`;

            let editMsg: boolean = true;
            setInterval(() => {
                if (!editMsg) editMsg = true;
            }, 7000);

            await ctx
                .replyWithHTML(`${finalText}\n${progressText(0)}`)
                .then((res) => {
                    outMsg = res.message || res;
                });

            await bot.snake.client
                .sendFile(ctx.chat.id, {
                    file: filePath,
                    replyTo: ctx.id,
                    forceDocument: true,
                    caption: finalText,
                    parseMode: "html",
                    progressCallback: async (progress) => {
                        if (editMsg) {
                            editMsg = false;
                            await bot.snake.telegram.editMessage(
                                ctx.chat.id,
                                outMsg.id,
                                `${finalText}\n${progressText(progress)}`,
                                {
                                    parseMode: "html",
                                    noWebpage: true
                                }
                            );
                        }
                    }
                })
                .then(async () => {
                    await bot.snake.telegram.deleteMessage(ctx.chat.id, [outMsg.id]);
                });
        },
        {
            context: ctx,
            adminOnly: true
        }
    );
});

let desc: string = "Ambil data!\n";
desc += "\n<code>/up FILE</code> -> Ambil berkas dari server";

bot.addHelp("files", desc);
