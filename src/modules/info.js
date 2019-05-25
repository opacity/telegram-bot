import BasicModule from "./basicModule.js";

export default class InfoModule extends BasicModule {
  commands() {
    this.bot.start(ctx => {
      ctx.reply("Hello!");
    })
  }
}
