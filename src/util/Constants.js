module.exports = {
  AkairoHandlerEvents: {
    LOAD: 'load',
    REMOVE: 'remove',
    ERROR: 'error'
  },
  TimeUnits: {
    years: {
      part: '(?:years?|y)',
      value: 1000 * 60 * 60 * 24 * 365,
    },
    months: {
      part: '(?:months?|mo)',
      value: 1000 * 60 * 60 * 24 * 30,
    },
    weeks: {
      part: '(?:weeks?|w)',
      value: 1000 * 60 * 60 * 24 * 7,
    },
    days: {
      part: '(?:days?|d)',
      value: 1000 * 60 * 60 * 24,
    },
    hours: {
      part: '(?:hours?|hrs?|h)',
      value: 1000 * 60 * 60,
    },
    minutes: {
      part: '(?:minutes?|mins?|m)',
      value: 1000 * 60,
    },
    seconds: {
      part: '(?:seconds?|secs?|s)',
      value: 1000,
    },
    milliseconds: {
      part: '(?:milliseconds?|msecs?|ms)',
      value: 1,
    },
  },
  CommandHandlerEvents: {
    MESSAGE_BLOCKED: 'messageBlocked',
    MESSAGE_INVALID: 'messageInvalid',
    COMMAND_BLOCKED: 'commandBlocked',
    COMMAND_STARTED: 'commandStarted',
    COMMAND_FINISHED: 'commandFinished',
    COMMAND_CANCELLED: 'commandCancelled',
    COMMAND_LOCKED: 'commandLocked',
    MISSING_PERMISSIONS: 'missingPermissions',
    COOLDOWN: 'cooldown',
    IN_PROMPT: 'inPrompt',
    ERROR: 'error'
  },
  BuiltInReasons: {
    CLIENT: 'client',
    BOT: 'bot',
    OWNER: 'owner',
    GUILD: 'guild',
    DM: 'dm'
  }
};
