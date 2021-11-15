/**
 * by dickymuliafiqri
 *
 * Stivolution main class, using tgsnake based on gramjs
 */

import packageData from "../package.json";
import si from "systeminformation";
import { Snake } from "tgsnake";
import { getEnv } from "../src/utils/Utilities";
import { userDataList } from "./Session";
import { MessageContext } from "tgsnake/lib/Context/MessageContext";
import simpleGit, { SimpleGit } from "simple-git";
import { existsSync } from "fs";
import { exec } from "child_process";

interface WrapperOptionsInterface {
  context: MessageContext | any;
  skipSessionCheck?: boolean;
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

  botImage!: string | Buffer;

  constructor() {
    super();

    // Initialize error handler
    this._bot.catch(async (err, ctx) => {
      const userId = ctx?.from?.id || ctx?.userId;
      let context: string;

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

      if (userId)
        await this._bot.telegram.sendMessage(
          userId,
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

          await this._git
            .init()
            .addRemote("origin", this.__url__, ["-t", this._branch]);
          await this._git.fetch("origin", this._branch);
          await this._git.checkout([
            "-b",
            this._branch,
            "--track",
            `origin/${this._branch}`,
            "-f"
          ]);
        }
      });

      /**
       * TODO
       *
       * - Send this message
       */
      const toReportRestart = Number(getEnv("TO_REPORT_RESTART", false) || 0);
      if (toReportRestart) {
        console.log("🐍 Successfully restart, sending report...");
        await this._bot.telegram
            .sendMessage(toReportRestart, "Berhasil memulai ulang")
            .then(() => {
              exec("TO_REPORT_RESTART=0");
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
    return (await this._bot.run().then(async () => {
      // If STRING_SESSION is not configured
      if (!process.env["STRING_SESSION"]) {
        // Print one to console
        let sessionString: string =
            "This is your string session, pass it to config.env!\n";
        sessionString += "\n----------";
        sessionString += `\n<code>${await this._bot.client.session.save()}</code>`;
        sessionString += "\n----------";

        setInterval(async () => {
          if (!this._bot.connected) await this._bot.run();
        }, 1000);

        await this._bot.telegram.sendMessage(this._chatLog, sessionString, {
          parseMode: "HTML"
        });
      }
    })) as Snake;
  }

  wrapper(handler: CallableFunction, options: WrapperOptionsInterface) {
    // Configure variable
    const userId = options.context.from?.id || options.context.userId || 0;

    // If user session isn't idle prevent handler to be executed
    if (!options.skipSessionCheck) {
      if (userDataList[userId]) {
        if (userDataList[userId]?.Session !== "Idle") return;
      }
    }

    // Execute handler
    return (
      (async () => {
        try {
          await handler();
        } catch (err: any) {
          await this._bot._handleError(err, err.message);
        }
      }) as CallableFunction
    )();
  }
}
