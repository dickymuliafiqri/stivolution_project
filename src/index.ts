/**
 * Project Name: stivolution_project
 *  |- github: dickymuliafiqri/stivolution_project
 *
 * Programmer: dickymuliafiqri
 *  |- github: dickymuliafiqri
 *  |- telegram: d_fordlalatina
 *
 * Start: Sat 23 October 2021 16:17
 *
 * This software is licensed on MIT
 * Programmer and or other collaborator(s) is not responsible at any type of misused
 * Please read our LICENSE for more details
 */

import { Stivolution } from "../core/Stivolution";
import { loadModules } from "./modules";
import { initDB, sqlite3 } from "./db";
import { config } from "dotenv";
import { existsSync } from "fs";

const envFile = ["config.env", "temp.env"];

// Load environment if file exists
envFile.forEach(file => {
  const filePath: string = `${process.cwd()}/${file}`;
  if (existsSync(filePath)) {
    config({
      path: filePath
    });
  }
});

const bot = new Stivolution();

// Run services
(async () => {
  // Initialize database
  await initDB();

  // Load installed modules and start bot
  await loadModules();
  await bot.start();
})();

export { bot, sqlite3 };
