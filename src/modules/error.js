import BasicModule from "./basicModule.js";

export default class ErrorModule extends BasicModule {
  middleware(bot) {
    bot.use(this.errorHandlingMiddleware);
  }

  async errorHandlingMiddleware(ctx, next) {
    try {
      await next(ctx);
    } catch(error) {
      // TODO: Set contextReply
      console.log("Uncaught error:");
      console.error(error);
    }
  }
}
