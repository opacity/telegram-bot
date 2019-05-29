import Telegraf from "telegraf";
import ErrorModule from "./modules/error.js";
import InfoModule from "./modules/info.js";

export default async function startBot() {
  const token = process.env.TG_API_TOKEN;
  const bot = new Telegraf(token, { retryAfter: 2 });
  const botInfo = await bot.telegram.getMe();
  bot.options.username = botInfo.username;
  bot.context.state = {};

  await ErrorModule.start(bot);
  await InfoModule.start(bot);

  console.log(`Starting Telegram bot @${bot.options.username}.`);
  bot.startPolling();
  return bot;
}
