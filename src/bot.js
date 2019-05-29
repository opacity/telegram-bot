import Telegraf from "telegraf";
import ErrorModule from "./modules/error.js";
import InfoModule from "./modules/info.js";
import DownloadModule from "./modules/download.js";

export default async function startBot() {
  const token = process.env.TG_API_TOKEN;
  const bot = new Telegraf(token, { retryAfter: 2 });
  const botInfo = await bot.telegram.getMe();
  bot.options.username = botInfo.username;
  bot.context.state = {};

  const endpoint = process.env.OPQ_ENDPOINT;

  await ErrorModule.start(bot);
  await InfoModule.start(bot);
  await DownloadModule.start(bot, { endpoint });

  console.log(`Starting Telegram bot @${bot.options.username}.`);
  bot.startPolling();
  return bot;
}
