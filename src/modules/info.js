import Composer from "telegraf";
import BasicModule from "./basicModule.js";
import { contextReply, render } from "../util.js";

const {
  command,
  privateChat
} = Composer;

export default class InfoModule extends BasicModule {
  commands(bot) {
    bot.use(
      privateChat(command(["start", "info"], this.sendInfo))
    );
  }

  async sendInfo(ctx) {
    const msg = await render("info");

    await contextReply(ctx, msg, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  }
}
