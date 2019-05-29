import { promises as fs } from "fs";
import path from "path";
import Handlebars from "handlebars";

const compiledViews = {};

export const HANDLE_REGEX = /\b[0-9a-f]{128}\b/i;

export async function contextReply(ctx, msg, opts) {
  if(!ctx.state) {
    ctx.state = {};
  }

  if(!ctx.state.reply) {
    ctx.state.reply = ctx.reply(msg, opts);
  } else {
    const reply = await ctx.state.reply;
    ctx.state.reply = ctx.telegram.editMessageText(reply.chat.id, reply.message_id, null, msg, opts);
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
    console.log("VIEW", context);
    compiledViews[viewName] = view;
  }

  return view(context);
}
