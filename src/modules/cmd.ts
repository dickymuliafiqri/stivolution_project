/**
 * by dickymuliafiqri
 *
 * Used to communicate with server console
 */

import { bot } from "..";
import { exec, spawn } from "child_process";
import { statSync } from "fs";

const fastFolderSizeSync = require("fast-folder-size/sync");

// RegExp
const lsRegExp = /^[\/!]ls\s?(.+)?/;
const execRegExp = /^[\/!]exec (.+)/;

bot.snake.hears(lsRegExp, async (ctx) => {
    bot.wrapper(
        async () => {
            const match: any = ctx.text?.match(lsRegExp);
            const chkDir: string = match[1] ? match[1] : bot.projectDir;
      let finalText: string = `<b>Isi Folder</b>`;
      finalText += "\n----------\n";
      finalText += `\n<code>${chkDir}</code>`;

      const ls: Array<string> | any = await new Promise((resolve, reject) => {
        exec(`ls "${chkDir}"`, (err, stdout, stderr) => {
          if (err) reject(err);
          if (stderr) reject(stderr);

            resolve(stdout.split("\n"));
        });
      }).catch((err) => {
          if (err.message.match("No such file or directory")) {
              finalText += "\n\t└<i>Tidak ditemukan</i>";
          } else {
              throw err;
          }
      });

            if (ls) {
                for (const path of ls) {
                    if (!path) continue;
                    const stat = statSync(
                        String(match[1]).match(/^\.?\/?/) || !match[1]
                            ? `${match[1] || chkDir}/${path}`
                            : path
                    );

                    try {
                        if (stat.isDirectory()) {
                            finalText += `\n\t└📁 <code>${path}</code>`;
                            finalText += `\n\t  └Size: ~<i>${(
                                fastFolderSizeSync(path) / 1000
                            ).toFixed(2)} KB</i>`;
                        } else {
                            finalText += `\n\t└📎 <code>${path}</code>`;
                            finalText += `\n\t  └Size: ~<i>${(stat.size / 1000).toFixed(
                                2
                            )} KB</i>`;
                        }
                        finalText += `\n\t  └Created at: <i>${new Date(
                            stat.birthtimeMs
                        ).toLocaleString()}</i>`;
                    } catch (err: any) {
                        finalText += `\n\t└⚠️ <i>${err.message}</i>`;
                    }
                }
            }

            if (finalText.length > 4090)
                finalText = finalText.substring(0, 4090) + "...";

            await ctx.replyWithHTML(finalText);
        },
        {
            context: ctx,
            adminOnly: true
        }
  );
});

bot.snake.hears(execRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      const match: any = ctx.text?.match(execRegExp);
      const cmd: Array<string> = match[1].split(" ");

      let refreshDelay: number = 0;
      let outMsgId: number;
      const term = spawn(cmd.shift() as string, [...cmd]);

      setInterval(() => {
        ++refreshDelay;
        if (refreshDelay === 3) refreshDelay = 0;
      }, 1000);

      term.stdout.on("data", async (data) => {
        if (!refreshDelay) {
          refreshDelay = 1;
          if (outMsgId) {
            await bot.snake.telegram.editMessage(
              ctx.chat.id,
              outMsgId,
              String(data)
            );
          } else {
            ctx.reply(String(data)).then((res) => (outMsgId = res.id));
          }
        }
      });

      term.stderr.on("data", async (data) => {
        await ctx.reply(String(data));
      });

        term.on("error", async (data) => {
            await ctx.reply(String(data));
        });

        term.on("close", async (code) => {
            await ctx.reply(`Child process exit with code ${code}`);
        });
    },
      {
          context: ctx,
          adminOnly: true
      }
  );
});

let desc: string = "Komunikasi dengan konsol\n";
desc += "\n<code>/ls [DIR]</code> -> Lihat isi folder";
desc += "\n<code>/exec [CMD]</code> -> Eksekusi perintah konsol";

bot.addHelp("cmd", desc);
