/**
 * by dickymuliafiqri
 *
 * Used to list all loaded modules and their short description
 */

import { bot } from "..";

// Help List
const helpList = bot.helpList;

// Regex
const helpRegExp: RegExp = /^[\/!]help$/i;
const helpModRegExp: RegExp = /^[\/!]help (\w+)/i;

bot.snake.hears(helpRegExp, async (ctx) => {
  let finalText: string = "";

  bot.wrapper(
    async () => {
      const moduleList: Array<string> = Object.keys(helpList);

      finalText = "<b>Daftar Modul</b>";
      finalText += `\nModul terdaftar: ${moduleList.length}`;
      finalText += "\nPenggunaan: <i>/help &lt;NAMA_MODUL&gt;</i>";
      finalText += "\n----------\n\n";

      moduleList.forEach((key) => {
        finalText += `${key} | `;
      });

      await ctx.replyWithHTML(finalText);
    },
    {
      context: ctx,
    }
  );
});

bot.snake.hears(helpModRegExp, async (ctx) => {
  const match: any = ctx.text?.match(helpModRegExp);
  let finalText: string = `Modul ${match[1]}`;
  bot.wrapper(
    async () => {
      finalText += "\n----------\n";

      if (helpList[match[1]]) finalText += `\n${helpList[match[1]]}`;
      else finalText = `Tidak ada modul dengan nama ${match[1]}`;

      await ctx.replyWithHTML(finalText);
    },
    {
      context: ctx,
    }
  );
});

bot.addHelp("help", "Daftar modul dan penjelasannya");
