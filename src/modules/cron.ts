/**
 * by dickymuliafiqri
 *
 * Used to do cron tasks
 */

const cron = require("node-cron");
import { bannedTimeCounter, flushFloodRecord } from "../../core/Session";

// Cron task every 6 hours at minute 0
const broadcaster = cron.schedule(
    "0 */6 * * *",
    () => {
      /**
       * TODO
       *
       * - To be filled with info broadcaster
       */
    },
    {
      timezone: "Asia/Jakarta"
    }
);

// Flood Record Flusher
// Run every minute
const floodFlusher = cron.schedule("* * * * *", () => {
  flushFloodRecord();
  bannedTimeCounter();
});

// Start cron jobs
broadcaster.start();
floodFlusher.start();
