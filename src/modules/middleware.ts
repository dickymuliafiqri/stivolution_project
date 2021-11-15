/**
 * by dickymuliafiqri
 *
 * Used to handle every single events
 */

import { bot } from "..";
import { Api } from "telegram/tl";

bot.snake.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  ctx.Date = new Date().toLocaleString();

  next();
});

// Send chat actions
bot.snake.on("message", async (ctx) => {
  const typing: Array<string> = [
    "start",
    "about",
    "login",
    "logout",
    "help",
    "ping",
    "cl",
    "update",
    "ls",
    "exec",
    "restart",
    "speedtest",
    "branch"
  ];
  const uploadPhoto: Array<string> = ["alive"];

  const sendAction: CallableFunction = (action: Api.TypeSendMessageAction) => {
    bot.snake.client.invoke(
      new Api.messages.SetTyping({
        peer: ctx.chat.id,
        action,
      })
    );
  };

  const action = (textList: Array<string>) => {
    for (const text of textList) {
      if ((ctx.text as string).match(new RegExp(`^/${text}`))) {
        return true;
      }
    }
  };

  if (action(typing)) {
    sendAction(new Api.SendMessageTypingAction());
  } else if (action(uploadPhoto)) {
    sendAction(
      new Api.SendMessageUploadPhotoAction({
        progress: 0,
      })
    );
  }
});
