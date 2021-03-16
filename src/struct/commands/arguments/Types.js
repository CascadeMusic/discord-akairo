const { Collection } = require('@cacade-music/discord.js');
const { URL } = require('url');

const AkairoError = require('../../../util/AkairoError');
const { TimeUnits } = require("../../../util/Constants");

const mentionTypes = {
  user: (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const id = phrase.match(/<@!?(\d{17,19})>/);
    if (!id) {
      return null;
    }
    return message.client.users.cache.get(id[1]) || null;
  },

  member: (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const id = phrase.match(/<@!?(\d{17,19})>/);
    if (!id) {
      return null;
    }
    return message.guild.members.cache.get(id[1]) || null;
  },

  channel: (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const id = phrase.match(/<#(\d{17,19})>/);
    if (!id) {
      return null;
    }
    return message.guild.channels.cache.get(id[1]) || null;
  },

  role: (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const id = phrase.match(/<@&(\d{17,19})>/);
    if (!id) {
      return null;
    }
    return message.guild.roles.cache.get(id[1]) || null;
  },

  emoji: (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const id = phrase.match(/<a?:[a-zA-Z0-9_]+:(\d{17,19})>/);
    if (!id) {
      return null;
    }
    return message.guild.emojis.cache.get(id[1]) || null;
  }
};

module.exports = {
  timespan: () => (message, phrase) => {
    if (!phrase) return null;

    const regexString = Object.entries(TimeUnits).map(([name, { label }]) => String.raw`(?:(?<${name}>-?(?:\d+)?\.?\d+) *${label})?`).join('\\s*');
    const match = new RegExp(`^${regexString}$`, 'i').exec(phrase);
    if (!match) return null;

    let milliseconds = 0;
    for (const key in match.groups) {
      const value = Number(match.groups[key] || 0);
      milliseconds += value * TimeUnits[key].value;
    }

    return milliseconds;
  },

  string: ({ casing } = {}) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return casing
      ? casing === 'upper'
        ? phrase.toUpperCase()
        : phrase.toLowerCase()
      : phrase;
  },

  charCodes: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const codes = [];
    for (const char of phrase) {
      codes.push(char.charCodeAt(0));
    }
    return codes;
  },

  number: ({ type } = {}) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    if (type === 'emojint') {
      const n = phrase.replace(/0⃣|1⃣|2⃣|3⃣|4⃣|5⃣|6⃣|7⃣|8⃣|9⃣|🔟/g, m => {
        return [ '0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟' ].indexOf(m);
      });
      if (isNaN(n)) {
        return null;
      }
      return parseInt(n);
    }

    if (isNaN(phrase)) {
      return null;
    }
    if (type === 'integer') {
      return parseInt(phrase);
    } else if (type === 'bigint') {
      try {
        return BigInt(phrase); // eslint-disable-line no-undef, new-cap
      } catch (_) {
        return null;
      }
    }
    return parseFloat(phrase);
  },

  url: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    if (/^<.+>$/.test(phrase)) {
      phrase = phrase.slice(1, -1);
    }

    try {
      return new URL(phrase);
    } catch (err) {
      return null;
    }
  },

  date: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const timestamp = Date.parse(phrase);
    if (isNaN(timestamp)) {
      return null;
    }
    return new Date(timestamp);
  },

  color: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const color = parseInt(phrase.replace('#', ''), 16);
    if (color < 0 || color > 0xFFFFFF || isNaN(color)) {
      return null;
    }

    return color;
  },

  user: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.util.resolveUser(phrase, message.client.users.cache);
  },

  users: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const users = message.client.util.resolveUsers(phrase, message.client.users.cache);
    return users.size ? users : null;
  },

  member: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.util.resolveMember(phrase, message.guild.members.cache);
  },

  members: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const members = message.client.util.resolveMembers(phrase, message.guild.members.cache);
    return members.size ? members : null;
  },

  relevant: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const person = message.channel.type === 'text'
      ? message.client.util.resolveMember(phrase, message.guild.members.cache)
      : message.channel.type === 'dm'
        ? message.client.util.resolveUser(phrase, new Collection([
          [ message.channel.recipient.id, message.channel.recipient ],
          [ message.client.user.id, message.client.user ]
        ]))
        : message.client.util.resolveUser(phrase, new Collection([
          [ message.client.user.id, message.client.user ]
        ]).concat(message.channel.recipients));

    if (!person) {
      return null;
    }
    if (message.channel.type === 'text') {
      return person.user;
    }
    return person;
  },

  relevants: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const persons = message.channel.type === 'text'
      ? message.client.util.resolveMembers(phrase, message.guild.members.cache)
      : message.channel.type === 'dm'
        ? message.client.util.resolveUsers(phrase, new Collection([
          [ message.channel.recipient.id, message.channel.recipient ],
          [ message.client.user.id, message.client.user ]
        ]))
        : message.client.util.resolveUsers(phrase, new Collection([
          [ message.client.user.id, message.client.user ]
        ]).concat(message.channel.recipients));

    if (!persons.size) {
      return null;
    }

    if (message.channel.type === 'text') {
      return persons.map(member => member.user);
    }

    return persons;
  },

  channel: ({ type } = {}) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const channel = message.client.util.resolveChannel(phrase, message.guild.channels.cache);
    if (!channel) {
      return null;
    }
    if (type && channel.type !== type) {
      return null;
    }

    return channel;
  },

  channels: ({ type } = {}) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const channels = message.client.util.resolveChannels(phrase, message.guild.channels.cache);
    if (!channels.size) {
      return null;
    }
    if (!type) {
      return channels;
    }

    const filtered = channels.filter(c => c.type === type);
    return filtered.size ? filtered : null;
  },

  role: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.util.resolveRole(phrase, message.guild.roles.cache);
  },

  roles: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const roles = message.client.util.resolveRoles(phrase, message.guild.roles.cache);
    return roles.size ? roles : null;
  },

  emoji: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.util.resolveEmoji(phrase, message.guild.emojis.cache);
  },

  emojis: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const emojis = message.client.util.resolveEmojis(phrase, message.guild.emojis.cache);
    return emojis.size ? emojis : null;
  },

  guild: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.util.resolveGuild(phrase, message.client.guilds.cache);
  },

  guilds: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    const guilds = message.client.util.resolveGuilds(phrase, message.client.guilds.cache);
    return guilds.size ? guilds : null;
  },

  message: ({ type } = {}) => {
    if (type === 'guild') {
      return async (message, phrase) => {
        if (!phrase) {
          return null;
        }
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.type !== 'text') {
            continue;
          }
          try {
            return await channel.messages.fetch(phrase);
          } catch (err) {
            if (/^Invalid Form Body/.test(err.message)) {
              return null;
            }
          }
        }
        return null;
      };
    } else if (type === 'relevant') {
      return async (message, phrase) => {
        if (!phrase) {
          return null;
        }
        const hereMsg = await message.channel.messages.fetch(phrase).catch(() => null);
        if (hereMsg) {
          return hereMsg;
        }

        if (message.guild) {
          for (const channel of message.guild.channels.cache.values()) {
            if (channel.type !== 'text') {
              continue;
            }
            try {
              return channel.messages.fetch(phrase);
            } catch (err) {
              if (/^Invalid Form Body/.test(err.message)) {
                return null;
              }
            }
          }
        }

        return null;
      };
    } else {
      return (message, phrase) => {
        if (!phrase) {
          return null;
        }
        return message.channel.messages.fetch(phrase).catch(() => null);
      };
    }
  },

  invite: () => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return message.client.fetchInvite(phrase).catch(() => null);
  },

  mention: ({ type } = {}) => {
    if (!type || !mentionTypes[type]) {
      throw new AkairoError('UNKNOWN_MENTION_TYPE', type);
    }
    return mentionTypes[type];
  },

  akairoModule: ({ handler }) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return handler.modules.get(phrase) || null;
  },

  commandAlias: ({ handler }) => (message, phrase) => {
    if (!phrase) {
      return null;
    }

    return handler.findCommand(phrase) || null;
  }
};

/**
 * The type that the argument should be cast to.
 *
 * An array of strings can be used to restrict input to only those strings, case insensitive.
 * The array can also contain an inner array of strings, for aliases.
 * If so, the first entry of the array will be used as the final argument.
 *
 * A regular expression can also be used.
 * The evaluated argument will be an object containing the `match` and `matches` if global.
 * @typedef {RegExp|string[]} ArgumentType
 */

/**
 * A function for processing user input to use as an argument.
 * A void return value will use the default value for the argument or start a prompt.
 * Any other truthy return value will be used as the evaluated argument.
 * If returning a Promise, the resolved value will go through the above steps.
 * @typedef {Function} ArgumentTypeCaster
 * @param {Message} message - Message that triggered the command.
 * @param {string} phrase - The user input.
 * @returns {any}
 */
