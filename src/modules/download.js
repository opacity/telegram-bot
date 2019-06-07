import BasicModule from "./basicModule.js";
import Composer from "telegraf";
import {
  findHandle,
  contextReply
} from "../util.js";
import Opaque from "opaque";

const {
  privateChat,
  groupChat,
  mention
} = Composer;

export default class DownloadModule extends BasicModule {
  constructor(bot, opts) {
    super(bot, opts);

    this.maxSizeMiB = 20;
    this.maxSize = this.maxSizeMiB * 1024 * 1024;
  }

  commands(bot) {
    const username = this.bot.options.username;
    const download = this.download.bind(this);

    bot.use(
      privateChat(download),
      groupChat(mention(username, download))
    );
  }

  async download(ctx, next) {
    // Look for handle in message and reply message text
    const handle = findHandle(ctx);

    if(!handle) {
      return next();
    }

    try {
      await contextReply(ctx, "Looking up file...", {
        reply_to_message_id: ctx.message.message_id
      });

      const download = new Opaque.Download(handle, {
        autoStart: false,
        endpoint: this.opts.endpoint
      });

      download.on("error", async err => {
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
      }, {
        reply_to_message_id: ctx.message.message_id
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
        ctx.state.isClientError = true;
        throw "Could not find a file with that handle";
      } else {
        throw error.message;
      }
    }
  }
}
