import BasicModule from "./basicModule.js";
import { contextReply, render } from "../util.js";

export default class InfoModule extends BasicModule {
  commands() {
    this.bot.start(this.sendInfo);
  }

  async sendInfo(ctx) {
    const msg = await render("info");

    await contextReply(ctx, msg, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  }
}
