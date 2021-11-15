/**
 * by dickymuliafiqri
 *
 * Communicate with repo
 */

import { bot } from "..";
import { inlineKeyboardButton } from "tgsnake/lib/Utils/ReplyMarkup";

// RegExp
const branchRegExp: RegExp = /^[\/!]branch$/;
const branchChangeRegExp: RegExp = /^[\/!]branch (.+)$/;

bot.snake.command("cl", async (ctx) => {
  bot.wrapper(
    async () => {
      const changelog = await bot.git.log({ maxCount: 10 });

      let commitList: any = {};
      changelog.all.forEach((commit) => {
        const message =
          commit.message.length > 25
            ? commit.message.substr(0, 25) + "..."
            : commit.message;
        commitList[commit.author_name] = commitList[commit.author_name]
          ? [...commitList[commit.author_name], message]
          : [message];
      });

      let finalText: string = "<b>10 Perubahan (Changelog) Terakhir</b>";
      finalText += "\n----------";

      for (const author of Object.keys(commitList)) {
        finalText += `\n\n${author}`;
        for (const commit of commitList[author]) {
          finalText += `\n\t└<i>${commit}</i>`;
        }
      }

      finalText += "\n\n<i>Changelog based on local branch</i>";
      await ctx.replyWithHTML(finalText);
    },
    {
      context: ctx,
    }
  );
});

bot.snake.command("update", async (ctx) => {
  bot.wrapper(
    async () => {
        await bot.git.fetch(["origin"]);
        await bot.git.checkout(["-B", bot.branch]);
      const status = await bot.git.status();
      const updateCount: number = status.behind;

      let finalText: string = "<b>Perbarui Stivolution</b>";
      finalText += "\n----------\n";

      let finalButton: Array<Array<inlineKeyboardButton>> = [[]];

      if (!updateCount) {
        finalText +=
          "\nTidak ada pembaruan, kamu sedang menggunakan bot dengan versi terbaru!";
      } else {
        finalText += "\nPembaruan tersedia!";

        const update = await bot.git.log([
          "--max-count",
          String(updateCount),
          `origin/${bot.branch}`,
        ]);
        update.all.forEach((commit) => {
          finalText += `\n- ${
            commit.message.length > 25
              ? commit.message.substr(0, 25) + "..."
              : commit.message
          }`;
          finalText += `\n\t└<i>${commit.author_name}</i>`;
          finalText += `\n\t└<i>${commit.date}</i>\n`;
        });

        finalButton[0][0] = {
          text: "Update",
          callbackData: "01/Update",
        };
      }

      if (finalText.length > 2000)
        finalText = `${finalText.substr(0, 2000)}...`;

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
    }
  );
});

bot.snake.hears(branchRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
        const branches = await bot.git.branch(["-r"]);

      let finalText: string = "<b>Daftar Branch</b>";
      finalText += "\n----------\n";

      for (const branch of branches.all) {
        const commits = await bot.git
            .log(["--max-count", "3", branch])
          .then((res) => {
            return res.all;
          });

        finalText += `\n<b>${
            branch.match(branches.current) ? branch + " 🟢" : branch
        }</b>`;
        commits.forEach((commit) => {
          finalText += `\n\t└<i>${commit?.message}</i>`;
          finalText += `\n\t  └<i>${commit?.date}</i>`;
        });
      }

      await ctx.replyWithHTML(finalText);
    },
    {
      context: ctx,
    }
  );
});

bot.snake.hears(branchChangeRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
        const match: any = ctx.text?.match(branchChangeRegExp);
        const selBranch: string = match[1];

        const branches = await bot.git.branch(["-r"]);
        const allBranches: Array<string> = branches.all;

        if (!allBranches.includes(selBranch))
            return await ctx.replyWithHTML("Branch tidak ditemukan!");
        if (bot.branch === selBranch)
            return await ctx.replyWithHTML(
                "Kamu sekarang sedang menggunakan branch tersebut!"
            );

        let finalText: string = "<b>Ganti Branch</b>";
        finalText += "\n----------\n";
        finalText += `\nTekan tombol di bawah untuk berganti dari branch <b>${bot.branch}</b> ke <b>${selBranch}</b>`;

        let finalButton: Array<Array<inlineKeyboardButton>> = [
            [
                {
                    text: "Ganti Branch",
                    callbackData: `01/ChangeBranch ${selBranch}`
                }
            ]
        ];

      await ctx.replyWithHTML(finalText, {
        replyMarkup: {
          inlineKeyboard: finalButton,
        },
      });
    },
    {
      context: ctx,
    }
  );
});

let desc: string = "Berkomunikasi dengan repo\n";
desc += "\n<code>/cl</code> -> Daftar 10 perubahan terakhir";
desc += "\n<code>/update</code> -> Perbarui bot";
desc += "\n<code>/branch [BRANCH] -> Lihat/Ganti branch</code>";

bot.addHelp("git", desc);
