/**
 * by dickymuliafiqri
 *
 * About this bot/project
 */

import { bot } from "..";
import { inlineKeyboardButton } from "tgsnake/lib/Utils/ReplyMarkup";

bot.snake.command("about", async (ctx) => {
  let finalText: string = "";
  let finalButton: Array<Array<inlineKeyboardButton>> = [[]];

  bot.wrapper(
      async () => {
          finalText = bot.__description__;
          finalText +=
              "\n\nDibuat menggunakan <a href='https://www.typescriptlang.org'>typescript</a>";

          finalButton = [
              [
                  {
                      text: "🏡 Homepage",
                      url: bot.__homepage__
                  }
              ]
          ];

          await ctx.replyWithHTML(finalText, {
              replyMarkup: {
                  inlineKeyboard: finalButton
              }
          });
      },
      {
          context: ctx
      }
  );
});

bot.addHelp("about", "Tentang bot");
