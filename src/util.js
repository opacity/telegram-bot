import { promises as fs } from "fs";
import path from "path";
import Handlebars from "handlebars";

const compiledViews = {};

export const HANDLE_REGEX = /\b[0-9a-f]{128}\b/i;

export function isCommand(ctx) {
  const msg = ctx.message || null;

  return msg && msg.entities && msg.entities[0].type === "bot_command";
}

export function argumentMiddleware(ctx, next) {
  const msg = ctx.message || null;
  const command = msg.entities[0];
  const arg = msg.text.substr(command.length + 1);

  ctx.arg = arg;
  ctx.argv = arg.trim().split(/\s+/);

  next();
}

export async function contextReply(ctx, msg, opts) {
  if(!ctx.state) {
    ctx.state = {};
  }

  if(!ctx.state.reply) {
    ctx.state.reply = ctx.reply(msg, opts);
  } else {
    const reply = await ctx.state.reply;
    ctx.state.reply = ctx.telegram.editMessageText(
      reply.chat.id,
      reply.message_id,
      null,
      msg,
      opts
    );
  }

  return await ctx.state.reply;
}

export async function render(viewName, context) {
  let view;

  if(compiledViews.hasOwnProperty(viewName)) {
    view = compiledViews[viewName];
  } else {
    const viewPath = path.resolve("src/views/", viewName + ".html");
    const rawView = await fs.readFile(viewPath);
    view = Handlebars.compile(rawView.toString());
    compiledViews[viewName] = view;
  }

  return view(context);
}

export function findHandle(ctx) {
  const chatMsg = ctx.message;
  const replyMsg = ctx.message.reply_to_message || null;
  let handle = false;

  if(replyMsg && replyMsg.text) {
    const match = replyMsg.text.match(HANDLE_REGEX);
    handle = match && match[0] ? match[0].trim() : handle;
  }

  if(!handle && chatMsg && chatMsg.text) {
    const match = chatMsg.text.match(HANDLE_REGEX);
    handle = match && match[0] ? match[0].trim() : handle;
  }

  return handle;
}

export function findFileInfo(ctx) {
  const chatMsg = ctx.message;
  const replyMsg = ctx.message.reply_to_message || null;

  return findFileInfoInMsg(replyMsg) || findFileInfoInMsg(chatMsg);
}

export function findFileInfoInMsg(msg) {
  if(!msg) {
    return null;
  } else if(msg.photo) {
    // Get highest resolution of photo
    return msg.photo.reverse()[0];
  } else {
    return msg.video || msg.audio || msg.document || null;
  }
}
