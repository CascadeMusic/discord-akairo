declare module "discord-akairo" {
  import { EventEmitter } from "events";

  import { Stream } from "stream";
  import {
    BufferResolvable,
    Channel,
    Client,
    ClientOptions,
    Collection,
    Emoji,
    Guild,
    GuildMember,
    Message,
    MessageAdditions,
    MessageAttachment,
    MessageEditOptions,
    MessageEmbed,
    MessageOptions,
    PermissionResolvable,
    Role,
    Snowflake,
    SplitOptions,
    StringResolvable,
    User,
    UserResolvable,
    Constructable
  } from "@cascade-music/discord.js";

  module "@cascade-music/discord.js" {
    export interface Message {
      util?: CommandUtil;
    }
  }

  export class AkairoError extends Error {
    constructor(key: "ALIAS_CONFLICT", alias: string, id: string, conflict: string);
    constructor(key: "ALREADY_LOADED" | "MODULE_NOT_FOUND" | "NOT_RELOADABLE", constructor: string, id: string);
    constructor(key: "COMMAND_UTIL_EXPLICIT");
    constructor(key: "FILE_NOT_FOUND", filename: string);
    constructor(key: "INVALID_CLASS_TO_HANDLE", given: string, expected: string);
    constructor(key: "INVALID_TYPE", name: string, expected: string, vowel?: boolean);
    constructor(key: "NOT_INSTANTIABLE", constructor: string);
    constructor(key: "NOT_IMPLEMENTED", constructor: string, method: string);
    constructor(key: "UNKNOWN_MATCH_TYPE", match: string);

    code: string;

    toString(): string;
  }

  export class AkairoClient extends Client {
    constructor(options?: AkairoOptions & ClientOptions, clientOptions?: ClientOptions);

    ownerID: Snowflake | Snowflake[];
    util: ClientUtil;

    isOwner(user: UserResolvable): boolean;
  }

  export class AkairoHandler<M extends AkairoModule = AkairoModule> extends EventEmitter {
    constructor(client: AkairoClient, options: AkairoHandlerOptions);

    automateCategories: boolean;
    extensions: Set<string>;
    categories: Collection<string, Category<string, M>>;
    classToHandle: Function;
    client: AkairoClient;
    directory: string;
    loadFilter: LoadPredicate;
    modules: Collection<string, M>;

    findCategory(name: string): Category<string, M>;

    load(thing: string | Function, isReload?: boolean): M;
    loadAll(directory?: string, filter?: LoadPredicate): Promise<this>;

    register(mod: M, filepath?: string): void;
    deregister(mod: M): void;

    reload(id: string): M;
    reloadAll(): this;

    remove(id: string): M;
    removeAll(): this;

    on(event: string, listener: (...args: any[]) => any): this;
    on(event: "remove", listener: (mod: M) => any): this;
    on(event: "load", listener: (mod: M, isReload: boolean) => any): this;

    static findExport(obj: Record<PropertyKey, any>): Constructable<AkairoModule> | null;
    static readdirRecursive(directory: string): string[];
  }

  export class AkairoModule {
    constructor(id: string, options?: AkairoModuleOptions);

    category: Category<string, AkairoModule>;
    categoryID: string;
    client: AkairoClient;
    filepath: string;
    handler: AkairoHandler<any>;
    id: string;

    reload(): this;
    remove(): this;
  }

  export class Argument {
    constructor(command: Command, options: ArgumentOptions);

    readonly client: AkairoClient;
    readonly handler: CommandHandler;

    command: Command;
    default: DefaultValueSupplier | any;
    description: string | any;
    index?: number;
    limit: number;
    match: ArgumentMatch;
    multipleFlags: boolean;
    flag?: string | string[];
    otherwise?: StringResolvable | MessageOptions | MessageAdditions | OtherwiseContentSupplier;
    prompt?: ArgumentPromptOptions | boolean;
    type: ArgumentType | ArgumentTypeCaster;
    unordered: boolean | number | number[];

    allow(message: Message): boolean;
    cast(message: Message, phrase: string): Promise<any>;
    collect(message: Message, commandInput?: string): Promise<Flag | any>;
    process(message: Message, phrase: string): Promise<any>;

    static cast(type: ArgumentType | ArgumentTypeCaster, message: Message, phrase: string): Promise<any>;
    static compose(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    static composeWithFailure(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    static isFailure(value: any): value is null | undefined | Flag & { value: any };
    static product(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    static range(type: ArgumentType | ArgumentTypeCaster, min: number, max: number, inclusive?: boolean): ArgumentTypeCaster;
    static tagged(type: ArgumentType | ArgumentTypeCaster, tag?: any): ArgumentTypeCaster;
    static taggedUnion(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    static taggedWithInput(type: ArgumentType | ArgumentTypeCaster, tag?: any): ArgumentTypeCaster;
    static union(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    static validate(type: ArgumentType | ArgumentTypeCaster, predicate: ParsedValuePredicate): ArgumentTypeCaster;
    static withInput(type: ArgumentType | ArgumentTypeCaster): ArgumentTypeCaster;
  }

  export class ArgumentRunner {
    static MATCHERS: Collection<ArgumentMatch, ArgumentMatcher>;

    constructor(command: Command);

    readonly command: Command;

    get client(): AkairoClient;
    get handler(): CommandHandler;

    run(message: Message, parsed: ContentParserResult, generator: ArgumentGenerator): Promise<Flag | any>;
    runOne(message: Message, parsed: ContentParserResult, state: ArgumentRunnerState, arg: Argument): Promise<Flag | any>;

    static increaseIndex(parsed: ContentParserResult, state: ArgumentRunnerState, n: number): void;
    static isShirtCircuit(value: any): boolean;
    static fromArguments(args: ArgumentOptions[]): GeneratorFunction;
  }

  export type ArgumentMatcher = (message: Message, parsed: ContentParserResult, state: ArgumentRunnerState, arg: Argument) => (Flag | any) | Promise<Flag | any>;

  export class Category<K, V> extends Collection<K, V> {
    constructor(id: string, iterable?: Iterable<[ K, V ][]>);

    id: string;

    reloadAll(): this;
    removeAll(): this;
  }

  export class ClientUtil {
    constructor(client: AkairoClient);

    readonly client: AkairoClient;

    attachment(file: BufferResolvable | Stream, name?: string): MessageAttachment;
    checkChannel(text: string, channel: Channel, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    checkEmoji(text: string, emoji: Emoji, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    checkGuild(text: string, guild: Guild, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    checkMember(text: string, member: GuildMember, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    checkRole(text: string, role: Role, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    checkUser(text: string, user: User, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    collection<K, V>(iterable?: Iterable<[ K, V ][]>): Collection<K, V>;
    compareStreaming(oldMember: GuildMember, newMember: GuildMember): number;
    permissionNames(): string[];
    embed(data?: object): MessageEmbed;
    fetchMember(guild: Guild, id: string, cache?: boolean): Promise<GuildMember>;
    resolveChannel(text: string, channels: Collection<Snowflake, Channel>, caseSensitive?: boolean, wholeWord?: boolean): Channel;
    resolveChannels(text: string, channels: Collection<Snowflake, Channel>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, Channel>;
    resolveEmoji(text: string, emojis: Collection<Snowflake, Emoji>, caseSensitive?: boolean, wholeWord?: boolean): Emoji;
    resolveEmojis(text: string, emojis: Collection<Snowflake, Emoji>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, Emoji>;
    resolveGuild(text: string, guilds: Collection<Snowflake, Guild>, caseSensitive?: boolean, wholeWord?: boolean): Guild;
    resolveGuilds(text: string, guilds: Collection<Snowflake, Guild>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, Guild>;
    resolveMember(text: string, members: Collection<Snowflake, GuildMember>, caseSensitive?: boolean, wholeWord?: boolean): GuildMember;
    resolveMembers(text: string, members: Collection<Snowflake, GuildMember>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, GuildMember>;
    resolvePermissionNumber(number: number): string[];
    resolveRole(text: string, roles: Collection<Snowflake, Role>, caseSensitive?: boolean, wholeWord?: boolean): Role;
    resolveRoles(text: string, roles: Collection<Snowflake, Role>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, Role>;
    resolveUser(text: string, users: Collection<Snowflake, User>, caseSensitive?: boolean, wholeWord?: boolean): User;
    resolveUsers(text: string, users: Collection<Snowflake, User>, caseSensitive?: boolean, wholeWord?: boolean): Collection<Snowflake, User>;
  }

  export class Command extends AkairoModule {
    constructor(id: string, options?: CommandOptions);

    aliases: string[];
    argumentDefaults: DefaultArgumentOptions;
    quoted: boolean;
    category: Category<string, Command>;
    channel?: string;
    client: AkairoClient;
    clientPermissions: PermissionResolvable | PermissionResolvable[] | MissingPermissionSupplier;
    cooldown?: number;
    description: string | any;
    editable: boolean;
    filepath: string;
    handler: CommandHandler;
    id: string;
    lock?: KeySupplier;
    locker?: Set<string>;
    ignoreCooldown?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    ignorePermissions?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    ownerOnly: boolean;
    prefix?: string | string[] | PrefixSupplier;
    ratelimit: number;
    regex: RegExp | RegexSupplier;
    typing: boolean;
    userPermissions: PermissionResolvable | PermissionResolvable[] | MissingPermissionSupplier;

    before(message: Message): any;
    condition(message: Message): boolean;
    exec(message: Message, args: any): any;
    parse(message: Message, content: string): Promise<Flag | any>;
    reload(): this;
    remove(): this;
  }

  export class CommandHandler extends AkairoHandler<Command> {
    constructor(client: AkairoClient, options: CommandHandlerOptions);

    aliasReplacement?: RegExp;
    aliases: Collection<string, string>;
    allowMention: boolean | MentionPrefixPredicate;
    argumentDefaults: DefaultArgumentOptions;
    blockBots: boolean;
    blockClient: boolean;
    classToHandle: typeof Command;
    client: AkairoClient;
    commandUtil: boolean;
    commandUtilLifetime: number;
    commandUtils: Collection<string, CommandUtil>;
    commandUtilSweepInterval: number;
    cooldowns: Collection<string, { [id: string]: CooldownData }>;
    defaultCooldown: number;
    directory: string;
    fetchMembers: boolean;
    handleEdits: boolean;
    ignoreCooldown: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    ignorePermissions: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    inhibitorHandler?: InhibitorHandler;
    prefix: string | string[] | PrefixSupplier;
    prefixes: Collection<string | PrefixSupplier, Set<string>>;
    prompts: Collection<string, Set<string>>;
    storeMessage: boolean;

    emitError(err: Error, message: Message, command?: Command): void;

    findCommand(name: string): Command;

    handle(message: Message): Promise<boolean | null>;
    handleDirectCommand(message: Message, content: string, command: Command, ignore?: boolean): Promise<boolean | null>;
    handleRegexAndConditionalCommands(message: Message): Promise<boolean>;
    handleRegexCommands(message: Message): Promise<boolean>;
    handleConditionalCommands(message: Message): Promise<boolean>;

    addPrompt(channel: Channel, user: User): void;
    hasPrompt(channel: Channel, user: User): boolean;
    removePrompt(channel: Channel, user: User): void;

    parseCommand(message: Message): Promise<ParsedComponentData>;
    parseCommandOverwrittenPrefixes(message: Message): Promise<ParsedComponentData>;
    parseMultiplePrefixes(message: Message, prefixes: [ string, Set<string> | null ]): ParsedComponentData;
    parseWithPrefix(message: Message, prefix: string, associatedCommands?: Set<string>): ParsedComponentData;

    runAllTypeInhibitors(message: Message): Promise<boolean>;
    runPermissionChecks(message: Message, command: Command): Promise<boolean>;
    runPreTypeInhibitors(message: Message): Promise<boolean>;
    runPostTypeInhibitors(message: Message, command: Command): Promise<boolean>;
    runCooldowns(message: Message, command: Command): boolean;
    runCommand(message: Message, command: Command, args: any): Promise<void>;

    useInhibitorHandler(inhibitorHandler: InhibitorHandler): this;

    on(event: "remove", listener: (command: Command) => any): this;
    on(event: "load", listener: (command: Command, isReload: boolean) => any): this;
    on(event: "commandBlocked", listener: (message: Message, command: Command, reason: string) => any): this;
    on(event: "commandBreakout", listener: (message: Message, command: Command, breakMessage: Message) => any): this;
    on(event: "commandCancelled", listener: (message: Message, command: Command, retryMessage?: Message) => any): this;
    on(event: "commandFinished", listener: (message: Message, command: Command, args: any, returnValue: any) => any): this;
    on(event: "commandLocked", listener: (message: Message, command: Command) => any): this;
    on(event: "commandStarted", listener: (message: Message, command: Command, args: any) => any): this;
    on(event: "cooldown", listener: (message: Message, command: Command, remaining: number) => any): this;
    on(event: "error", listener: (error: Error, message: Message, command?: Command) => any): this;
    on(event: "inPrompt" | "messageInvalid", listener: (message: Message) => any): this;
    on(event: "messageBlocked", listener: (message: Message, reason: string) => any): this;
    on(event: "missingPermissions", listener: (message: Message, command: Command, type: "client" | "user", missing?: any) => any): this;
  }

  export class CommandUtil {
    constructor(handler: CommandHandler, message: Message);

    handler: CommandHandler;
    lastResponse?: Message;
    message: Message;
    messages?: Collection<Snowflake, Message>;
    parsed?: ParsedComponentData;
    shouldEdit: boolean;

    addMessage(message: Message): Message;
    addMessage(message: Message[]): Message[];

    edit(content?: StringResolvable, options?: MessageEmbed | MessageEditOptions): Promise<Message>;
    edit(options?: MessageOptions | MessageAdditions): Promise<Message>;

    reply(content?: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<Message>;
    reply(content?: StringResolvable, options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    reply(content?: StringResolvable, options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;
    reply(options?: MessageOptions | MessageAdditions): Promise<Message>;
    reply(options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    reply(options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;

    send(content?: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<Message>;
    send(content?: StringResolvable, options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    send(content?: StringResolvable, options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;
    send(options?: MessageOptions | MessageAdditions): Promise<Message>;
    send(options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    send(options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;

    sendNew(content?: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<Message>;
    sendNew(content?: StringResolvable, options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    sendNew(content?: StringResolvable, options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;
    sendNew(options?: MessageOptions | MessageAdditions): Promise<Message>;
    sendNew(options?: MessageOptions & { split?: false } | MessageAdditions): Promise<Message>;
    sendNew(options?: MessageOptions & { split: true | SplitOptions } | MessageAdditions): Promise<Message[]>;

    setEditable(state: boolean): this;

    setLastResponse(message: Message | Message[]): Message;

    static transformOptions(content?: StringResolvable, options?: MessageOptions | MessageAdditions): any[];
  }

  export class Flag {
    constructor(type: string, data: object);

    type: string;

    static cancel(): Flag;
    static continue(command: string, ignore?: boolean, rest?: string): Flag & { command: string, ignore: boolean, rest: string };
    static retry(message: Message): Flag & { message: Message };
    static fail(value: any): Flag & { value: any };
    static is(value: any, type: "cancel"): value is Flag;
    static is(value: any, type: "continue"): value is Flag & { command: string, ignore: boolean, rest: string };
    static is(value: any, type: "retry"): value is Flag & { message: Message };
    static is(value: any, type: "fail"): value is Flag & { value: any };
    static is(value: any, type: string): value is Flag;
  }

  export class Inhibitor extends AkairoModule {
    constructor(id: string, options?: InhibitorOptions);

    category: Category<string, Inhibitor>;
    client: AkairoClient;
    filepath: string;
    handler: InhibitorHandler;
    id: string;
    reason: string;
    type: InhibitorType;

    exec(message: Message, command?: Command): boolean | Promise<boolean>;
    reload(): this;
    remove(): this;
  }

  export type InhibitorType = "all" | "pre" | "post";

  export class InhibitorHandler extends AkairoHandler<Inhibitor> {
    constructor(client: AkairoClient, options: AkairoHandlerOptions);

    classToHandle: typeof Inhibitor;
    client: AkairoClient;
    directory: string;

    test(type: "all" | "pre" | "post", message: Message, command?: Command): Promise<string | void>;
  }

  export class Listener extends AkairoModule {
    constructor(id: string, options?: ListenerOptions);

    category: Category<string, Listener>;
    client: AkairoClient;
    emitter: string | EventEmitter;
    event: string;
    filepath: string;
    handler: ListenerHandler;
    type: string;

    exec(...args: any[]): any;
    reload(): this;
    remove(): this;
  }

  export class ListenerHandler extends AkairoHandler<Listener> {
    constructor(client: AkairoClient, options: AkairoHandlerOptions);

    classToHandle: typeof Listener;
    client: AkairoClient;
    directory: string;
    emitters: Collection<string, EventEmitter>;

    addToEmitter(id: string): Listener;
    removeFromEmitter(id: string): Listener;
    setEmitters(emitters: { [x: string]: EventEmitter }): void;

    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "error", listener: (error: Error, listener: Listener, args: any[]) => any): this;
  }

  export class Util {
    static isEventEmitter(value: any): boolean;
    static isPromise(value: any): boolean;
  }

  export interface AkairoHandlerOptions {
    automateCategories?: boolean;
    classToHandle?: Function;
    directory?: string;
    extensions?: string[] | Set<string>;
    loadFilter?: LoadPredicate;
  }

  export interface AkairoModuleOptions {
    category?: string;
  }

  export interface AkairoOptions {
    ownerID?: Snowflake | Snowflake[];
  }

  export interface DefaultArgumentOptions {
    prompt?: ArgumentPromptOptions;
    otherwise?: StringResolvable | MessageOptions | MessageAdditions | OtherwiseContentSupplier;
    modifyOtherwise?: OtherwiseContentModifier;
  }

  export interface ArgumentOptions {
    default?: DefaultValueSupplier | any;
    description?: StringResolvable;
    id?: string;
    index?: number;
    limit?: number;
    match?: ArgumentMatch;
    modifyOtherwise?: OtherwiseContentModifier;
    multipleFlags?: boolean;
    flag?: string | string[];
    otherwise?: StringResolvable | MessageOptions | MessageAdditions | OtherwiseContentSupplier;
    prompt?: ArgumentPromptOptions | boolean;
    type?: ArgumentType | ArgumentTypeCaster;
    unordered?: boolean | number | number[];
  }

  export interface ArgumentPromptData {
    infinite: boolean;
    message: Message;
    retries: number;
    phrase: string;
    failure: void | (Flag & { value: any });
  }

  export interface ArgumentPromptOptions {
    breakout?: boolean;
    cancel?: StringResolvable | MessageOptions | MessageAdditions | PromptContentSupplier;
    cancelWord?: string;
    ended?: StringResolvable | MessageOptions | MessageAdditions | PromptContentSupplier;
    infinite?: boolean;
    limit?: number;
    modifyCancel?: PromptContentModifier;
    modifyEnded?: PromptContentModifier;
    modifyRetry?: PromptContentModifier;
    modifyStart?: PromptContentModifier;
    modifyTimeout?: PromptContentModifier;
    optional?: boolean;
    retries?: number;
    retry?: StringResolvable | MessageOptions | MessageAdditions | PromptContentSupplier;
    start?: StringResolvable | MessageOptions | MessageAdditions | PromptContentSupplier;
    stopWord?: string;
    time?: number;
    timeout?: StringResolvable | MessageOptions | MessageAdditions | PromptContentSupplier;
  }

  export interface ArgumentRunnerState {
    index: number;
    phraseIndex: number;
    usedIndices: Set<number>;
  }

  export interface CommandOptions extends AkairoModuleOptions {
    aliases?: string[];
    args?: ArgumentOptions[] | ArgumentGenerator;
    argumentDefaults?: DefaultArgumentOptions;
    before?: BeforeAction;
    channel?: "guild" | "dm";
    clientPermissions?: PermissionResolvable | PermissionResolvable[] | MissingPermissionSupplier;
    condition?: ExecutionPredicate;
    cooldown?: number;
    description?: StringResolvable;
    editable?: boolean;
    flags?: string[];
    ignoreCooldown?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    ignorePermissions?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    lock?: KeySupplier | "guild" | "channel" | "user";
    optionFlags?: string[];
    ownerOnly?: boolean;
    prefix?: string | string[] | PrefixSupplier;
    ratelimit?: number;
    regex?: RegExp | RegexSupplier;
    separator?: string;
    typing?: boolean;
    userPermissions?: PermissionResolvable | PermissionResolvable[] | MissingPermissionSupplier;
    quoted?: boolean;
  }

  export interface CommandHandlerOptions extends AkairoHandlerOptions {
    aliasReplacement?: RegExp;
    allowMention?: boolean | MentionPrefixPredicate;
    argumentDefaults?: DefaultArgumentOptions;
    blockBots?: boolean;
    blockClient?: boolean;
    commandUtil?: boolean;
    commandUtilLifetime?: number;
    commandUtilSweepInterval?: number;
    defaultCooldown?: number;
    fetchMembers?: boolean;
    handleEdits?: boolean;
    ignoreCooldown?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    ignorePermissions?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
    prefix?: string | string[] | PrefixSupplier;
    storeMessages?: boolean;
  }

  export interface ContentParserResult {
    all: StringData[];
    phrases: StringData[];
    flags: StringData[];
    optionFlags: StringData[];
  }

  export interface CooldownData {
    end: number;
    timer: NodeJS.Timer;
    uses: number;
  }

  export interface FailureData {
    phrase: string;
    failure: void | (Flag & { value: any });
  }

  export interface InhibitorOptions extends AkairoModuleOptions {
    reason?: string;
    type?: InhibitorType;
    priority?: number;
  }

  export interface ListenerOptions extends AkairoModuleOptions {
    emitter: string | EventEmitter;
    event: string;
    type?: string;
  }

  export interface ParsedComponentData {
    afterPrefix?: string;
    alias?: string;
    command?: Command;
    content?: string;
    prefix?: string;
  }

  export type StringData = {
    type: "Phrase";
    value: string;
    raw: string;
  } | {
    type: "Flag";
    key: string;
    raw: string;
  } | {
    type: "OptionFlag",
    key: string;
    value: string;
    raw: string;
  };

  export type ArgumentMatch =
    "phrase"
    | "flag"
    | "option"
    | "rest"
    | "separate"
    | "text"
    | "content"
    | "restContent"
    | "none";

  export type ArgumentType = (string | string[])[] | RegExp;

  export type ArgumentGenerator = (message: Message, parsed: ContentParserResult, state: ArgumentRunnerState) => IterableIterator<ArgumentOptions | Flag>;

  export type ArgumentTypeCaster<R = any> = (message: Message, phrase: string) => R | Promise<R>;

  export type BeforeAction = (message: Message) => any | Promise<any>;

  export type DefaultValueSupplier = (message: Message, data: FailureData) => any | Promise<any>;

  export type ExecutionPredicate = (message: Message) => boolean | Promise<boolean>;

  export type KeySupplier = (message: Message, args: any) => string | Promise<string>;

  export type LoadPredicate = (filepath: string) => boolean | Promise<boolean>;

  export type IgnoreCheckPredicate = (message: Message, command: Command) => boolean | Promise<boolean>;

  export type MentionPrefixPredicate = (message: Message) => boolean | Promise<boolean>;

  export type MissingPermissionSupplier = (message: Message) => any | Promise<any>;

  export type OtherwiseContentModifier = (message: Message, text: string, data: FailureData)
    => StringResolvable | MessageOptions | MessageAdditions | Promise<StringResolvable | MessageOptions | MessageAdditions>;

  export type OtherwiseContentSupplier = (message: Message, data: FailureData)
    => StringResolvable | MessageOptions | MessageAdditions | Promise<StringResolvable | MessageOptions | MessageAdditions>;

  export type ParsedValuePredicate = (message: Message, phrase: string, value: any) => boolean | Promise<boolean>;

  export type PrefixSupplier = (message: Message) => string | string[] | Promise<string | string[]>;

  export type PromptContentModifier = (message: Message, text: string, data: ArgumentPromptData)
    => StringResolvable | MessageOptions | MessageAdditions | Promise<StringResolvable | MessageOptions | MessageAdditions>;

  export type PromptContentSupplier = (message: Message, data: ArgumentPromptData)
    => StringResolvable | MessageOptions | MessageAdditions | Promise<StringResolvable | MessageOptions | MessageAdditions>;

  export type RegexSupplier = (message: Message) => RegExp | Promise<RegExp>;

  export const Constants: {
    ArgumentMatches: {
      PHRASE: "phrase";
      FLAG: "flag";
      OPTION: "option";
      REST: "rest";
      SEPARATE: "separate";
      TEXT: "text";
      CONTENT: "content";
      REST_CONTENT: "restContent";
      NONE: "none";
    };
    AkairoHandlerEvents: {
      LOAD: "load";
      REMOVE: "remove";
    };
    CommandHandlerEvents: {
      MESSAGE_BLOCKED: "messageBlocked";
      MESSAGE_INVALID: "messageInvalid";
      COMMAND_BLOCKED: "commandBlocked";
      COMMAND_STARTED: "commandStarted";
      COMMAND_FINISHED: "commandFinished";
      COMMAND_CANCELLED: "commandCancelled";
      COMMAND_LOCKED: "commandLocked";
      MISSING_PERMISSIONS: "missingPermissions";
      COOLDOWN: "cooldown";
      IN_PROMPT: "inPrompt";
      ERROR: "error";
    };
    BuiltInReasons: {
      CLIENT: "client";
      BOT: "bot";
      OWNER: "owner";
      GUILD: "guild";
      DM: "dm";
    };
  };

  type TypeFunction<O = never> = (options?: O) => ArgumentTypeCaster;

  export const Types: {
    string: TypeFunction<{ casing: 'lower' | 'upper' | undefined }>;
    number: TypeFunction<{ type: 'integer' | 'bigint' | 'emojint' | undefined }>;
    channel: TypeFunction<{ type: 'text' | 'voice' | 'category' | 'news' | 'store' | undefined }>;
    channels: TypeFunction<{ type: 'text' | 'voice' | 'category' | 'news' | 'store' | undefined }>;
    message: TypeFunction<{ type: 'guild' | 'relevant' | undefined }>;
    mention: TypeFunction<{ type: 'user' | 'member' | 'channel' | 'role' | 'emoji' }>;
    akairoModule: TypeFunction<{ handler: AkairoHandler }>;
    commandAlias: TypeFunction<{ handler: CommandHandler }>;
  } & Record<
    | 'charCodes' | 'url' | 'date' | 'color'
    | 'user' | 'users'
    | 'member' | 'members'
    | 'relevant' | 'relevants'
    | 'role' | 'roles'
    | 'emoji' | 'emojis'
    | 'guild' | 'guilds'
    | 'invite',
    TypeFunction
    >;

  export const version: string;
}
