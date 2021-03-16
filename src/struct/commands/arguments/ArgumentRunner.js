const { Collection } = require("@cascade-music/discord.js");

const AkairoError = require("../../../util/AkairoError");
const Argument = require("./Argument");
const Flag = require("../Flag");

/**
 * Runs arguments.
 * @param {Command} command - Command to run for.
 * @private
 */
class ArgumentRunner {
  /**
   * Matchers used within the ArgumentRunner
   * @type {Collection<string, ArgumentMatcher>>}
   */
  static MATCHERS = new Collection()

  /**
   * @param {Command} command Command instance
   */
  constructor(command) {
    this.command = command;
  }

  /**
   * The Akairo client.
   * @type {AkairoClient}
   */
  get client() {
    return this.command.client;
  }

  /**
   * The command handler.
   * @type {CommandHandler}
   */
  get handler() {
    return this.command.handler;
  }

  /**
   * Runs the arguments.
   * @param {Message} message - Message that triggered the command.
   * @param {ContentParserResult} parsed - Parsed data from ContentParser.
   * @param {ArgumentGenerator} generator - Argument generator.
   * @returns {Promise<Flag|any>}
   */
  async run(message, parsed, generator) {
    const state = {
      usedIndices: new Set(),
      phraseIndex: 0,
      index: 0
    };

    const augmentRest = val => {
      if (Flag.is(val, "continue")) {
        val.rest = parsed.all.slice(state.index).map(x => x.raw).join("");
      }
    };

    const iter = generator(message, parsed, state);
    let curr = await iter.next();
    while (!curr.done) {
      const value = curr.value;
      if (ArgumentRunner.isShortCircuit(value)) {
        augmentRest(value);
        return value;
      }

      const res = await this.runOne(message, parsed, state, new Argument(this.command, value));
      if (ArgumentRunner.isShortCircuit(res)) {
        augmentRest(res);
        return res;
      }

      curr = await iter.next(res);
    }

    augmentRest(curr.value);
    return curr.value;
  }

  /**
   * Runs one argument.
   * @param {Message} message - Message that triggered the command.
   * @param {ContentParserResult} parsed - Parsed data from ContentParser.
   * @param {ArgumentRunnerState} state - Argument handling state.
   * @param {Argument} arg - Current argument.
   * @returns {Promise<Flag|any>}
   */
  runOne(message, parsed, state, arg) {
    const runFn = ArgumentRunner.MATCHERS.get(arg.match);
    if (runFn == null) {
      throw new AkairoError("UNKNOWN_MATCH_TYPE", arg.match);
    }

    return runFn.call(this, message, parsed, state, arg);
  }

  /**
   * Modifies state by incrementing the indices.
   * @param {ContentParserResult} parsed - Parsed data from ContentParser.
   * @param {ArgumentRunnerState} state - Argument handling state.
   * @param {number} n - Number of indices to increase by.
   */
  static increaseIndex(parsed, state, n = 1) {
    state.phraseIndex += n;

    while (n > 0) {
      do {
        state.index++;
      } while (parsed.all[state.index] && parsed.all[state.index].type !== "Phrase");
      n--;
    }
  }

  /**
   * Checks if something is a flag that short circuits.
   * @param {any} value - A value.
   * @returns {boolean}
   */
  static isShortCircuit(value) {
    return Flag.is(value, "cancel") || Flag.is(value, "retry") || Flag.is(value, "continue");
  }

  /**
   * Creates an argument generator from argument options.
   * @param {ArgumentOptions[]} args - Argument options.
   * @returns {GeneratorFunction}
   */
  static fromArguments(args) {
    return function* generate() {
      const res = {};
      for (const [ id, arg ] of args) {
        res[id] = yield arg;
      }

      return res;
    };
  }
}

ArgumentRunner.MATCHERS.set("phrase", async (message, parsed, state, arg) => {
  if (arg.unordered || arg.unordered === 0) {
    const indices = typeof arg.unordered === "number"
      ? Array.from(parsed.phrases.keys()).slice(arg.unordered)
      : Array.isArray(arg.unordered)
        ? arg.unordered
        : Array.from(parsed.phrases.keys());

    for (const i of indices) {
      if (state.usedIndices.has(i)) {
        continue;
      }

      const phrase = parsed.phrases[i]
        ? parsed.phrases[i].value
        : "";

      // `cast` is used instead of `process` since we do not want prompts.
      const res = await arg.cast(message, phrase);
      if (res != null) {
        state.usedIndices.add(i);
        return res;
      }
    }

    // No indices matched.
    return arg.process(message, "");
  }

  const index = arg.index == null
    ? state.phraseIndex
    : arg.index;

  const ret = arg.process(message, parsed.phrases[index]
    ? parsed.phrases[index].value
    : "");

  if (arg.index == null) {
    await ArgumentRunner.increaseIndex(parsed, state);
  }

  return ret;
});

ArgumentRunner.MATCHERS.set("rest", async (message, parsed, state, arg) => {
  const index = arg.index == null
    ? state.phraseIndex
    : arg.index;

  const rest = parsed.phrases.slice(index, index + arg.limit).map(x => x.raw).join("").trim(),
    ret = await arg.process(message, rest);

  if (arg.index == null) {
    ArgumentRunner.increaseIndex(parsed, state);
  }

  return ret;
});

ArgumentRunner.MATCHERS.set("separate", async (message, parsed, state, arg) => {
  const index = arg.index == null
    ? state.phraseIndex
    : arg.index;

  const phrases = parsed.phrases.slice(index, index + arg.limit);
  if (!phrases.length) {
    const ret = await arg.process(message, "");
    if (arg.index != null) {
      ArgumentRunner.increaseIndex(parsed, state);
    }

    return ret;
  }

  const res = [];
  for (const phrase of phrases) {
    const response = await arg.process(message, phrase.value);
    if (Flag.is(response, "cancel")) {
      return response;
    }

    res.push(response);
  }

  if (arg.index != null) {
    ArgumentRunner.increaseIndex(parsed, state);
  }

  return res;
});

ArgumentRunner.MATCHERS.set("flag", (message, parsed, state, arg) => {
  const names = Array.isArray(arg.flag) ? arg.flag : [ arg.flag ];
  if (arg.multipleFlags) {
    return parsed.flags.filter(flag => names.some(name => name.toLowerCase() === flag.key.toLowerCase()))
      .length;
  }

  const flagFound = parsed.flags.some(flag => names.some(name => name.toLowerCase() === flag.key.toLowerCase()));
  return arg.default == null
    ? flagFound
    : !flagFound;
});

ArgumentRunner.MATCHERS.set("option", async (message, parsed, state, arg) => {
  const names = Array.isArray(arg.flag) ? arg.flag : [ arg.flag ];
  if (arg.multipleFlags) {
    const values = parsed.optionFlags.filter(flag => names.some(name => name.toLowerCase() === flag.key.toLowerCase())).map(x => x.value).slice(0, arg.limit),
      res = [];

    for (const value of values) {
      res.push(await arg.process(message, value));
    }

    return res;
  }

  const foundFlag = parsed.optionFlags.find(flag => names.some(name => name.toLowerCase() === flag.key.toLowerCase()));
  return arg.process(message, foundFlag != null ? foundFlag.value : "");
});

ArgumentRunner.MATCHERS.set("text", (message, parsed, state, arg) => {
  const index = arg.index == null
    ? 0
    : arg.index;

  return arg.process(message, parsed.phrases
    .slice(index, index + arg.limit).map(x => x.raw).join("")
    .trim());
});

ArgumentRunner.MATCHERS.set("content", (message, parsed, state, arg) => {
  const index = arg.index == null ? 0 : arg.index;
  const content = parsed.all.slice(index, index + arg.limit).map(x => x.raw).join("").trim();
  return arg.process(message, content);
});

ArgumentRunner.MATCHERS.set("restContent", async (message, parsed, state, arg) => {
  const index = arg.index == null
    ? state.index
    : arg.index;

  const rest = parsed.all.slice(index, index + arg.limit).map(x => x.raw).join("").trim(),
    ret = await arg.process(message, rest);

  if (arg.index == null) {
    ArgumentRunner.increaseIndex(parsed, state);
  }

  return ret;
});

ArgumentRunner.MATCHERS.set("none", (message, _, _, arg) => arg.process(message, ""));

module.exports = ArgumentRunner;

/**
 * State for the argument runner.
 * @typedef {Object} ArgumentRunnerState
 * @prop {Set<number>} usedIndices - Indices already used for unordered match.
 * @prop {number} phraseIndex - Index in terms of phrases.
 * @prop {number} index - Index in terms of the raw strings.
 */

/**
 * @typedef {Function} ArgumentMatcher
 * @param {Message} message - Message that triggered the command.
 * @param {ContentParserResult} parsed - Parsed data from ContentParser.
 * @param {ArgumentRunnerState} state - Argument handling state.
 * @param {Argument} arg - Current argument.
 */
