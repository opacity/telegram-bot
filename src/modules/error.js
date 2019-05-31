import BasicModule from "./basicModule.js";
import { contextReply, render } from "../util.js";

export default class ErrorModule extends BasicModule {
  middleware(bot) {
    bot.use(this.errorHandlingMiddleware);
  }

  async errorHandlingMiddleware(ctx, next) {
    try {
      await next(ctx);
    } catch(error) {
      if(ctx.state.isClientError) {
        await contextReply(ctx, error.message || error);
      } else {
        const msg = await render("error", { error });

        await contextReply(ctx, msg, {
          parse_mode: "HTML",
          disable_web_page_preview: true
        });

        console.log("Uncaught error:");
        console.error(error);
      }
    }
  }
}
