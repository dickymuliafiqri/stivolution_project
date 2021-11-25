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

            const outMsg = await bot.snake.client.sendMessage(ctx.chat.id, {
                message: `${finalText}\n${progressText(0)}`,
                replyTo: ctx.id,
                parseMode: "html"
            });

            await bot.snake.client
                .sendFile(ctx.chat.id, {
                    file: filePath,
                    replyTo: ctx.id,
                    forceDocument: true,
                    caption: finalText,
                    parseMode: "html",
                    progressCallback: (progress) => {
                        if (editMsg) {
                            editMsg = false;
                            bot.snake.client.editMessage(ctx.chat.id, {
                                message: outMsg,
                                text: `${finalText}\n${progressText(progress)}`,
                                parseMode: "html",
                                linkPreview: false
                            }).catch((err) => {
                                if (!err.message.match("MESSAGE_NOT_MODIFIED")) throw err;
                            });
                        }
                    }
                })
                .then(() => {
                    bot.snake.client.deleteMessages(ctx.chat.id, [outMsg.id], {
                        revoke: true
                    });
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
