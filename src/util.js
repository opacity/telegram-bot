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
