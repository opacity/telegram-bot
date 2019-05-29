export default class BasicModule {
  constructor(bot, opts = {}) {
    const moduleName = this.constructor.name
    const moduleKey = moduleName.replace(/Module$/, "").toLowerCase();

    if(!bot.context.hasOwnProperty("modules")) {
      bot.context.modules = {};
    }

    this.bot = bot;
    this.opts = opts;
    bot.context.modules[moduleKey] = this;

    console.log(`Loading module ${moduleName} at ctx.modules.${moduleKey}`);
  }

  static async start(bot, opts) {
    const mod = new this(bot, opts);

    await mod.init(bot);
    await mod.middleware(bot);
    await mod.commands(bot);

    return mod;
  }

  init() {}
  middleware() {}
  commands() {}
}
