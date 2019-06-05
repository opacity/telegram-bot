import Telegraf from "telegraf";
import RedisModule from "./modules/redis.js";
import ErrorModule from "./modules/error.js";
import InfoModule from "./modules/info.js";
import StatsModule from "./modules/stats.js";
import DownloadModule from "./modules/download.js";
import UploadModule from "./modules/upload.js";
import { isCommand, argumentMiddleware } from "./util.js";

export default async function startBot() {
  console.log("Initializing Telegram bot..");

  const token = process.env.TG_API_TOKEN;
  const bot = new Telegraf(token, { retryAfter: 2 });
  const botInfo = await bot.telegram.getMe();
  const endpoint = process.env.OPQ_ENDPOINT;
  const redisOpts = {
    keyPrefix: process.env.REDIS_PREFIX || "",
    db: process.env.REDIS_DB || 0
  }
  const uploadOpts = {
    handle: process.env.OPQ_HANDLE,
    cooldown: process.env.TG_UPLOAD_COOLDOWN,
    endpoint
  }

  bot.options.username = botInfo.username;
  bot.context.state = {};

  // Provide ctx.arg and ctx.argv for all commands
  bot.use(Telegraf.optional(isCommand, argumentMiddleware));

  console.log("Loading modules..");
  await RedisModule.start(bot, redisOpts);
  await ErrorModule.start(bot);
  await InfoModule.start(bot);
  await StatsModule.start(bot);
  await DownloadModule.start(bot, { endpoint });
  await UploadModule.start(bot, uploadOpts);

  bot.startPolling();

  console.log(`Started Telegram bot @${bot.options.username}!`);

  return bot;
}
