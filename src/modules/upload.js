import BasicModule from "./basicModule.js";
import Opaque from "opaque";
import { getFile, getFileInfo } from "../core/file.js";
import path from "path";
import { contextReply, render } from "../util.js";

export default class UploadModule extends BasicModule {
  constructor(bot, opts) {
    super(bot);

    const handle = opts.handle;
    const endpoint = opts.endpoint;
    const uploadOpts = { endpoint };
    const downloadOpts = { endpoint };

    this.maxSizeMiB = 50;
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

  commands(bot) {
    bot.on("document", async (ctx) => {
      const fileInfo = ctx.message.document;
      await this.upload(ctx, fileInfo);
    })

    bot.on("photo", async (ctx) => {
      // Get highest resolution of photo
      const fileInfo = ctx.message.photo.reverse()[0]
      await this.upload(ctx, fileInfo)
    })

    bot.on("audio", async (ctx) => {
      const fileInfo = ctx.message.audio
      await this.upload(ctx, fileInfo)
    })

    bot.on("video", async (ctx) => {
      const fileInfo = ctx.message.video
      await this.upload(ctx, fileInfo)
    })
  }

  async upload(ctx, documentInfo) {
    await contextReply(ctx, "Checking file...");
    const fileInfo = await getFileInfo(ctx, documentInfo.file_id);
    const fileName = documentInfo.file_name || path.basename(fileInfo.file_path);

    if(fileInfo.file_size > this.maxSize) {
      throw `File too big. Only files up to ${this.maxSizeMiB}MiB accepted.\nFor larger files use https://opacity.io/`;
    }

    await contextReply(ctx, "Fetching file...");
    const file = await getFile(fileInfo.file_path);
    await contextReply(ctx, "Uploading file...");
    const upload = this.masterHandle.uploadFile("/", {
      data: file,
      name: fileName
    });

    upload.on("progress", async (progress) => {
      console.log("progress", progress);
      await contextReply(ctx, "Progress");
    });

    upload.on("finish", this.finishUpload.bind(this, ctx));
  }

  async finishUpload(ctx, event) {
    const msg = await render("upload", { handle: event.handle });

    contextReply(ctx, msg, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  }
}
