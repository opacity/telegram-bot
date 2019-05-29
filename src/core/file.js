import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const fileEndpoint = `https://api.telegram.org/file/bot${process.env.TG_API_TOKEN}/`;

// File info from TG
export async function getFileInfo(ctx, fileId) {
  return await ctx.telegram.getFile(fileId);
}

// File from TG
export async function getFile(filePath) {
  return await fetch(fileEndpoint + filePath).then(res => res.buffer());
}
