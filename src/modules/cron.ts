/**
 * by dickymuliafiqri
 *
 * Used to do cron tasks
 */

const cron = require("node-cron");

// Cron task every 6 hours at minute 0
const task = cron.schedule(
  "0 */6 * * *",
  () => {
    /**
     * TODO
     *
     * - To be filled with info broadcaster
     */
  },
  {
    timezone: "Asia/Jakarta",
  }
);

task.start();
