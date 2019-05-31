import Telegraf from "telegraf";
import RedisModule from "./modules/redis.js";
import ErrorModule from "./modules/error.js";
import InfoModule from "./modules/info.js";
import DownloadModule from "./modules/download.js";
import UploadModule from "./modules/upload.js";
import { isCommand, argumentMiddleware } from "./util.js";

export default async function startBot() {
  const token = process.env.TG_API_TOKEN;
  const bot = new Telegraf(token, { retryAfter: 2 });
  const botInfo = await bot.telegram.getMe();
  const handle = process.env.OPQ_HANDLE;
  const endpoint = process.env.OPQ_ENDPOINT;
  const redisOpts = {
    keyPrefix: process.env.REDIS_PREFIX || "",
    db: process.env.REDIS_DB || 0
  }

  bot.options.username = botInfo.username;
  bot.context.state = {};

  // Provide ctx.arg and ctx.argv for all commands
  bot.use(Telegraf.optional(isCommand, argumentMiddleware));

  await RedisModule.start(bot, redisOpts);
  await ErrorModule.start(bot);
  await InfoModule.start(bot);
  await DownloadModule.start(bot, { endpoint });
  await UploadModule.start(bot, { handle, endpoint });

  console.log(`Starting Telegram bot @${bot.options.username}.`);
  bot.startPolling();

  return bot;
}
