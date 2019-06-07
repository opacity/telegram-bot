import bytes from "bytes"
import moment from "moment";
import format from "format-number";
import Composer from "telegraf";
import BasicModule from "./basicModule.js";
import { contextReply, render } from "../util.js";

const TIME_FORMAT = "Y.MM.DD.HH";
const {
  command,
  privateChat
} = Composer;

export default class StatsModule extends BasicModule {
  init(bot) {
    this.redis = bot.context.redis;
    this.format = format();

    bot.context.logStats = this.logStats.bind(this);
  }

  commands(bot) {
    const showStats = this.showStats.bind(this);

    bot.use(
      privateChat(command("stats", showStats))
    );
  }

  async showStats(ctx) {
    const [ uploadStats, downloadStats ] = await this.getStats();
    const totalUploads = uploadStats.shift().pop();
    const totalDownloads = downloadStats.shift().pop();
    const dailyUploads = uploadStats.reduce(this.sumStats, {count: 0, bytes: 0});
    const dailyDownloads = downloadStats.reduce(this.sumStats, {count: 0, bytes: 0});
    const format = this.format;

    const msg = await render("stats", {
      upload: {
        total: {
          count: format(parseInt(totalUploads.count || 0)),
          bytes: bytes(parseInt(totalUploads.bytes || 0))
        },
        daily: {
          count: format(dailyUploads.count || 0),
          bytes: bytes(dailyUploads.bytes || 0)
        }
      },
      download: {
        total: {
          count: format(parseInt(totalDownloads.count || 0)),
          bytes: bytes(parseInt(totalDownloads.bytes || 0))
        },
        daily: {
          count: format(dailyDownloads.count || 0),
          bytes: bytes(dailyDownloads.bytes || 0)
        }
      }
    });

    await contextReply(ctx, msg, {
      parse_mode: "HTML"
    });
  }

  async getStats () {
    let keys = this.getKeys(moment(), 24);
    let uploadPipe = this.redis.pipeline();
    let downloadPipe = this.redis.pipeline();

    uploadPipe.hgetall("upload.total");
    downloadPipe.hgetall("download.total");

    for (let i = 0; i < keys.length; i++) {
      uploadPipe.hgetall("upload.hourly." + keys[i])
      downloadPipe.hgetall("download.hourly." + keys[i])
    }

    return await Promise.all([uploadPipe.exec(), downloadPipe.exec()])
  }

  getKeys (startTime, count) {
    const keys = [];

    while (count-- > 0) {
      const datetime = moment(startTime).subtract(count, "hours");
      keys.push(datetime.format(TIME_FORMAT));
    }

    return keys;
  }

  sumStats (acc, data) {
    const stats = data.pop();

    acc.count += parseInt(stats.count, 10) || 0;
    acc.bytes += parseInt(stats.bytes, 10) || 0;

    return acc;
  }

  async logStats(key, stats) {
    try {
      const pipeline = this.redis.pipeline();
      const totalKey = key + ".total";
      const datetimeKey = key + ".hourly." + moment().format(TIME_FORMAT);

      Object.keys(stats).forEach(field => {
        const val = stats[field];

        pipeline.hincrby(totalKey, field, val);
        pipeline.hincrby(datetimeKey, field, val)
      });

      return await pipeline.exec();
    } catch(err) {
      console.warn(err);
    }
  }
}
