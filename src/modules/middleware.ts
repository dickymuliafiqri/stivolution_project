/**
 * by dickymuliafiqri
 *
 * Used to handle every single events
 */

import { bot } from "..";
import { Api } from "telegram/tl";
import { bannedUser, userFloodControl } from "../../core/Session";

// RegExp
const commandPrefix: RegExp = /^[\/!.]/;

bot.snake.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  ctx.Date = new Date().toLocaleString();

  next();
});

// Send chat actions
bot.snake.hears(commandPrefix, async (ctx) => {
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
    "branch",
    "up"
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
          progress: 0
        })
    );
  }
});

// Flood handler
bot.snake.hears(commandPrefix, async (ctx) => {
  bot.wrapper(
      async () => {
        const userId: number = ctx.from.id;
        const command: string = String(ctx.text).split(" ")[0];

        if (!userFloodControl[userId]) {
          userFloodControl[userId] = [
            {
              command,
              number: 1
            }
          ];
        } else {
          for (const floodIndex in userFloodControl[userId]) {
            if (userFloodControl[userId][floodIndex].command === command) {
              const number: number = userFloodControl[userId][floodIndex].number;

              if (number > 5) {
                bannedUser[userId] = {
                  minute: 3,
                  warned: false
                };
                return;
              }

              userFloodControl[userId][floodIndex].number = number + 1;
              return;
            }
          }

          userFloodControl[userId].push({
            command,
            number: 1
          });
        }
      },
      {
        context: ctx
      }
  );
});
