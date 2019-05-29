import BasicModule from "./basicModule.js";
import { contextReply, HANDLE_REGEX } from "../util.js";
import Opaque from "opaque";

export default class DownloadModule extends BasicModule {
  constructor(bot, opts) {
    super(bot, opts);

    this.maxSizeMiB = 50;
    this.maxSize = this.maxSizeMiB * 1024 * 1024;
  }

  commands(bot) {
    bot.hears(HANDLE_REGEX, this.download.bind(this));
  }

  async download(ctx) {
    const handle = ctx.message.text.match(HANDLE_REGEX)[0].trim();

    try {
      await contextReply(ctx, "Looking up file...");
      const download = new Opaque.Download(handle, {
        autoStart: false,
        endpoint: this.opts.endpoint
      });

      download.on("error", asyncerr => {
        throw err;
      })

      const metadata = await download.metadata();

      if(metadata.size > this.maxSize) {
        return contextReply(ctx, "File is too big!");
      }

      await contextReply(ctx, "Downloading file...");
      const buf = await download.toBuffer();

      await contextReply(ctx, "Sending file...");
      await ctx.replyWithDocument({
        source: buf,
        filename: metadata.name
      });
      const reply = await ctx.state.reply;
      ctx.deleteMessage(reply.message_id);

    } catch(error) {
      let msg;

      if (error.response) {
        msg = error.response.data;
      } else {
        msg = error.message || error;
      }

      console.error("Download Error:");
      console.error(error);
      contextReply(ctx, msg);
    }
  }
}
