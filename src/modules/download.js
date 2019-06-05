import BasicModule from "./basicModule.js";
import { contextReply, HANDLE_REGEX } from "../util.js";
import Opaque from "opaque";

export default class DownloadModule extends BasicModule {
  constructor(bot, opts) {
    super(bot, opts);

    this.maxSizeMiB = 20;
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
      });

      const metadata = await download.metadata();

      if(metadata.size > this.maxSize) {
        return contextReply(ctx, `File too large. Only files up to ${this.maxSizeMiB}MiB are accepted.\n\nFor larger files please use https://opacity.io/`);
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

      ctx.logStats("download", {
        bytes: metadata.size,
        count: 1
      });

    } catch(error) {
      let msg;

      console.error("Download Error:");
      console.error(error);

      if(error.response && error.response.data && error.response.data === "such data does not exist") {
        throw "Could not find a file with that handle";
      } else {
        throw error.message;
      }
    }
  }
}
