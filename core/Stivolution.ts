/**
 * by dickymuliafiqri
 *
 * Stivolution main class, using tgsnake based on gramjs
 */

import packageData from "../package.json";
import si from "systeminformation";
import { Snake } from "tgsnake";
import { getEnv } from "../src/utils/Utilities";
import { bannedUser, userDataList } from "./Session";
import { MessageContext } from "tgsnake/lib/Context/MessageContext";
import simpleGit, { SimpleGit } from "simple-git";
import { existsSync, writeFileSync } from "fs";
import { bot, sqlite3 } from "../src";
import { default as axios } from "axios";

interface WrapperOptionsInterface {
  context: MessageContext | any;
  skipSessionCheck?: boolean;
  adminOnly?: boolean;
}

interface IgnoreErrorTextInterface {
  trigger?: string | RegExp;
  errorMessage: string;
}

interface HelpInterface {
  [key: string]: string;
}

class StivolutionBaseClass {
  __version__: string = packageData.version;
  __homepage__: string = packageData.homepage;
  __description__: string = packageData.description;
  __url__: string = packageData.repository.url;
  projectDir: string = process.cwd();
}

export class Stivolution extends StivolutionBaseClass {
  private _bot: Snake = new Snake();
  private _chatLog: number = Number(getEnv("CHAT_LOG"));
  private _helpList: HelpInterface = {};
  private _databaseApi: string = getEnv("DB_API", true) as string;
  private _branch!: string;
  private _git: SimpleGit = simpleGit({
    baseDir: this.projectDir,
  });

  logger = getEnv("LOGGER", true);
  botImage!: string | Buffer;

  constructor() {
    super();

    // Initialize error handler
    this._bot.catch(async (err, ctx) => {
      const chatId = ctx?.chat?.id || ctx?.userId;
      const trigger: string = String(ctx?.text || ctx?.data?.toString());
      let context: string;

      // Ignore error
      /**
       * TODO
       *
       * We use this guy for now
       * Need to find the better way to ignore errors
       */
      const ignoreErrorText: Array<IgnoreErrorTextInterface> = [
        {
          errorMessage: "MESSAGE_NOT_MODIFIED"
        }
      ];
      for (const ignoredError of ignoreErrorText) {
        if (err?.message?.match(ignoredError.errorMessage)) return;
      }

      // Stringify context
      try {
        context = JSON.stringify(ctx, null, 2);
      } catch (err) {
        context = "Failed to parse context!";
      }

      let errorMessage: string = "========== An Error Occurred ==========\n";
      errorMessage += `\n${context}\n`;
      errorMessage += "\n---------- DEAD SNAKE START ----------\n";
      errorMessage += `\n${err.stack}\n`;
      errorMessage += "\n----------- DEAD SNAKE END -----------";

      await this._bot.telegram.sendDocument(
        this._chatLog,
        Buffer.from(errorMessage),
        {
          fileName: "log.txt",
        }
      );

      if (chatId)
        await this._bot.telegram.sendMessage(
            chatId,
            `Terjadi kesalahan, laporan telah dikirimkan ke tim pengembang\n\n${err.message}`
        );
    });

    // Get bot image/banner
    if (this.__version__.match("gndrng"))
      this.botImage = existsSync(
        this.projectDir + "/docs/images/Gandrung_Banner.png"
      )
        ? `${this.projectDir}/docs/images/Gandrung_Banner.png`
        : "https://raw.githubusercontent.com/dickymuliafiqri/stivolution_project/beta/docs/images/Gandrung_Banner.png";
    else
      this.botImage = existsSync(
        this.projectDir + "/docs/images/Sengsem_Banner.png"
      )
        ? `${this.projectDir}/docs/images/Sengsem_Banner.png`
        : "https://raw.githubusercontent.com/dickymuliafiqri/stivolution_project/beta/docs/images/Sengsem_Banner.png";

    // Send message when bot is connected
    this._bot.on("connected", async () => {
      this._branch = this.__version__.match("gndrng") ? "main" : "beta";

      await this._git.checkIsRepo().then(async (isRepo) => {
        if (!isRepo) {
          console.log("🐍 Configuring repository upstream...");

          await this._git.init().addRemote("origin", this.__url__);
          await this._git.fetch("origin");
          await this._git.branch(["--track", "main", "origin/main"]);
          await this._git.branch(["--track", "beta", "origin/beta"]);
          await this._git.checkout(["-B", this._branch, "-f"]);
          await this._git.reset(["--hard", `origin/${this._branch}`]);

          // Configure github email and username
          await this._git.addConfig("user.name", "stivolution");
          await this._git.addConfig(
              "user.email",
              "stivolution@users.noreply.github.com"
          );
        }
      });

      let restartId: any = getEnv("RESTART_ID", false) || "";
      if (restartId) {
        console.log("🐍 Successfully restart, sending report...");

        restartId = restartId.split("::");
        const chatId: number = Number(restartId[0]);
        const msgId: number = Number(restartId[1]);
        await this._bot.telegram
            .editMessage(chatId, msgId, "Bot restarted!")
            .then(() => {
              writeFileSync(`${this.projectDir}/temp.env`, "RESTART_ID=''", {
                flag: "w+"
              });
            });
      }

      console.log("🐍 Sending botInfo to CHAT_LOG...");
      await this._bot.telegram.sendPhoto(this._chatLog, this.botImage, {
        caption: await this.buildBotInfo(),
        parseMode: "HTML",
      });
    });
  }

  get snake(): Snake {
    return this._bot;
  }

  get helpList(): HelpInterface {
    return this._helpList;
  }

  get databaseApi(): string {
    return this._databaseApi;
  }

  get git(): SimpleGit {
    return this._git;
  }

  get branch(): string {
    return this._branch;
  }

  set branch(branch: string) {
    this._branch = branch;
  }

  addHelp(name: string, description: string) {
    if (this._helpList[name])
      console.error(
          `🐍 Description for ${name} is conflict with another module!`
      );
    this._helpList[name] = description;
  }

  async buildBotInfo(): Promise<string> {
    // Build botInfo message
    let botInfo: string = `Stivolution ${this.__version__} is Up!`;
    botInfo += `\n----------\n`;
    botInfo += "\n<b>Framework Information</b>";
    botInfo += `\n・NodeJS: ${process.version}`;
    botInfo += `\n・GramJS: ${this._bot.client.__version__}`;
    botInfo += `\n・tgSnake: ${this._bot.version}\n`;

    botInfo += "\n<b>Server Information</b>";
    botInfo += "\n⎧";

    // Get OS info
    await si.osInfo((data) => {
      botInfo += `\n⎪- OS`;
      botInfo += `\n⎪\t  └Platform: ${data.platform} ${data.arch}`;
      botInfo += `\n⎪\t    └Codename: ${data.codename}`;
      botInfo += `\n⎪\t    └Build: ${data.build}`;
    });

    // Get CPU info
    await si.cpu((data) => {
      botInfo += `\n⎪- CPU`;
      botInfo += `\n⎪\t  └Manufacture: ${data.manufacturer}`;
      botInfo += `\n⎪\t  └Brand: ${data.brand}`;
      botInfo += `\n⎪\t  └Speed: ${data.speed} GHz`;
      botInfo += `\n⎪\t  └Cores: ${data.cores}`;
    });

    // Get memory info
    await si.mem((data) => {
      botInfo += `\n⎪- Memory`;
      botInfo += `\n⎪\t  └Total: ${(data.total / 1000000).toFixed()} MB`;
      botInfo += `\n⎪\t    └Active: ${(data.active / 1000000).toFixed()} MB`;
      botInfo += `\n⎪\t    └Available: ${(
        data.available / 1000000
      ).toFixed()} MB`;
    });

    // Get memory layout
    await si.memLayout((layoutData) => {
      botInfo += "\n⎪\t  └Layout";
      layoutData.forEach((data) => {
        botInfo += `\n⎪\t    └${data.bank}`;
        botInfo += `\n⎪\t      └Manufacture: ${data.manufacturer}`;
        botInfo += `\n⎪\t      └Type: ${data.type}`;
        botInfo += `\n⎪\t      └C.Speed: ${data.clockSpeed} Mhz`;
        botInfo += `\n⎪\t      └Size: ${(data.size / 1000000).toFixed()} MB`;
      });
    });

    // Get disk layout
    await si.diskLayout((layoutData) => {
      botInfo += `\n⎪- File System`;

      layoutData.forEach((data) => {
        botInfo += `\n⎪\t  └${data.device}`;
        botInfo += `\n⎪\t    └Vendor: ${data.vendor}`;
        botInfo += `\n⎪\t    └Name: ${data.name}`;
        botInfo += `\n⎪\t    └Type: ${data.type}`;
        botInfo += `\n⎪\t    └Size: ${(data.size / 1000000000).toFixed()} GB`;
      });
    });
    botInfo += "\n⎩";

    return botInfo;
  }

  async start(): Promise<Snake> {
    const bot = (await this._bot.run().then(async () => {
      // If STRING_SESSION is not configured
      if (!process.env["STRING_SESSION"]) {
        // Print one to console
        let sessionString: string =
            "This is your string session, pass it to config.env!\n";
        sessionString += "\n----------";
        sessionString += `\n<code>${await this._bot.client.session.save()}</code>`;
        sessionString += "\n----------";

        await this._bot.telegram.sendMessage(this._chatLog, sessionString, {
          parseMode: "html"
        });
      }

      // Configure client
      this._bot.client.floodSleepThreshold = 60;
      this._bot.client.setParseMode("html");
    })) as Snake;

    // Try to reconnect client when it disconnected
    setInterval(async () => {
      const isUserConnected: boolean | undefined =
          this._bot?.client?._sender?._userConnected;
      if (isUserConnected === false) {
        if (this.logger === "debug") {
          this._bot.client._log.error(`Bot disconnected!`);
        }
        await this._bot.client.connect().then(async () => {
          await this._bot.telegram
              .sendMessage(this._chatLog, "Bot reconnected!")
              .then(() => {
                this._bot.client._log.info("Bot reconnected!");
              });
        });
      }
    }, 1000);

    return bot;
  }

  wrapper(handler: CallableFunction, options: WrapperOptionsInterface) {
    // Configure variable
    const userId = options.context.from?.id || options.context.userId || 0;
    const chatId = options.context.chat?.id;

    // If user session isn't idle prevent handler to be executed
    if (!options.skipSessionCheck) {
      if (userDataList[userId]) {
        if (userDataList[userId].Session !== "Idle") return;
      }
    }

    // Execute handler
    return (
      (async () => {
        let isVerified: boolean = false;

        if (bannedUser[userId]?.minute) {
          if (!bannedUser[userId].warned) {
            bannedUser[userId].warned = true;
            const bannedText: string = `kamu diblokir...\n<i>coba lagi dalam ${bannedUser[userId].minute} menit</i>`;

            try {
              return await options.context.replyWithHTML(bannedText);
            } catch (e) {
              return await this._bot.telegram.sendMessage(userId, bannedText);
            }
          } else {
            return;
          }
        }

        try {
          if (options.adminOnly) {
            const db = await sqlite3.connect();
            const user = await new Promise((resolve, reject) => {
              db?.get(
                  `SELECT * FROM Users WHERE UserID = ?`,
                  [userId],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                  }
              );
            })
                .then((res) => {
                  if (res) return Object(res);
                })
                .catch((err) => {
                  throw err;
                })
                .finally(() => {
                  sqlite3.close(db);
                });

            if (user) {
              await axios
                  .post(bot.databaseApi, {
                    id: user.NIM,
                    pass: user.Password
                  })
                  .then(async (res) => {
                    if (res.data.admin) isVerified = true;
                  });
            }
          } else {
            isVerified = true;
          }

          if (!isVerified)
            return options.context.replyWithHTML(
                "Kamu tidak memiliki otoritas untuk menjalankan perintah di atas."
            );

          await handler();
        } catch (err: any) {
          await this._bot._handleError(err, err.message);
        }
      }) as CallableFunction
    )();
  }
}
