import path from "path";
import Composer from "telegraf";
import Opaque from "opaque";
import BasicModule from "./basicModule.js";
import { getFile, getFileInfo } from "../core/file.js";
import {
  findFileInfo,
  contextReply,
  render
} from "../util.js";

const {
  privateChat,
  groupChat,
  mention
} = Composer;

export default class UploadModule extends BasicModule {
  constructor(bot, opts) {
    super(bot);

    const handle = opts.handle;
    const endpoint = opts.endpoint;
    const uploadOpts = { endpoint };
    const downloadOpts = { endpoint };

    this.cooldown = parseInt(opts.cooldown, 10) || 60;
    this.maxSizeMiB = 20;
    this.maxSize = this.maxSizeMiB * 1024 * 1024;
    this.masterHandle = new Opaque.MasterHandle(
      {
        handle
      },
      {
        uploadOpts,
        downloadOpts
      }
    );
  }

  async commands(bot) {
    const username = this.bot.options.username;
    const upload = this.upload.bind(this);

    bot.use(
      privateChat(upload),
      groupChat(mention(username, upload))
    );
  }

  async upload(ctx, next) {
    const documentInfo = await findFileInfo(ctx);

    if(!documentInfo) {
      return next();
    }

    if(documentInfo.file_size > this.maxSize) {
      ctx.state.isClientError = true;
      throw `File too large. Only files up to ${this.maxSizeMiB}MiB are accepted.\n\nFor larger files please use https://opacity.io/`;
    }

    await contextReply(ctx, "Checking file...", {
      reply_to_message_id: ctx.message.message_id
    });
    
    const fileInfo = await getFileInfo(ctx, documentInfo.file_id);
    const fileName = documentInfo.file_name || path.basename(fileInfo.file_path);
    const userId = ctx.message.from.id;
    const lockKey = "lock:upload:" + userId;
    let lock;

    try {
      lock = await ctx.lock(lockKey, this.cooldown * 1000);
    } catch(e) {
      const ttl = await ctx.redis.ttl(lockKey);
      ctx.state.isClientError = true;

      if(ttl > (this.cooldown - 2)) {
        throw "Please only upload a single file at a time.";
      } else {
        throw `Please wait another ${ttl} seconds.`;
      }
    }

    await contextReply(ctx, "Fetching file...");
    const file = await getFile(fileInfo.file_path);
    await contextReply(ctx, "Uploading file...");

    const upload = new Opaque.Upload(
      { data: file, name: fileName },
      this.masterHandle,
      this.masterHandle.uploadOpts
    );

    const result = await new Promise((resolve, reject) => {
      upload.on("finish", resolve);
      upload.on("error", reject);
    });

    const msg = await render("upload", { handle: result.handle });

    await contextReply(ctx, msg, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });

    ctx.logStats("upload", {
      bytes: documentInfo.file_size,
      count: 1
    })
  }
}
