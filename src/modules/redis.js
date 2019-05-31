import Redis from "ioredis";
import Redlock from "redlock";
import BasicModule from "./basicModule.js";

export default class RedisModule extends BasicModule {
  async init(bot) {
    this.client = new Redis(this.opts);
    this.redlock = new Redlock([this.client], {
      // Fail immediately if the key is already locked
      // See: https://github.com/mike-marcacci/node-redlock/issues/52
      retryCount: 0
    });

    bot.context.redis = this.client;
    bot.context.lock = this.redlock.lock.bind(this.redlock);
  }
}
