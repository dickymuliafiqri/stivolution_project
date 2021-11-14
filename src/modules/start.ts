/**
 * by dickymuliafiqri
 *
 * Used to greet new user
 */

import { bot } from "..";

bot.snake.command("start", async (ctx) => {
  bot.wrapper(
    async () => {
      await ctx.reply("Halo, aku adalah bot official STIKOM Banyuwangi");
    },
    {
      context: ctx,
    }
  );
});

bot.addHelp("start", "Pesan sambutan dari bot");
