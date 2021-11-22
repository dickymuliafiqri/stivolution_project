/**
 * by dickymuliafiqri
 *
 * Used to communicate with server console
 */

import { bot } from "..";
import { exec, spawn } from "child_process";
import { lstatSync } from "fs";

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

      if (ls)
        ls.forEach((path: string) => {
          if (!path) return;
          try {
            if (
              lstatSync(
                String(match[1]).match(/^\.?\/?/) || !match[1]
                  ? `${match[1] || chkDir}/${path}`
                  : path
              ).isDirectory()
            ) {
              finalText += `\n\t└📁 <code>${path}</code>`;
            } else {
              finalText += `\n\t└📎 <code>${path}</code>`;
            }
          } catch (err: any) {
            finalText += `\n\t└⚠️ <i>${err.message}</i>`;
          }
        });

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
