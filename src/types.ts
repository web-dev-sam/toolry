export type ArgType = "string" | "boolean" | "number" | "path";

export interface ArgDef {
  type: ArgType;
  description: string;
  required?: boolean;
  default?: string | boolean | number;
  options?: string[]; // for select prompts
  placeholder?: string;
  /** Only for type: 'path' — starting directory for autocomplete (defaults to cwd) */
  root?: string;
  /** Only for type: 'path' — when true, only directories are suggested */
  directory?: boolean;
}

export type ArgsDef = Record<string, ArgDef>;

export type InferArgs<T extends ArgsDef> = {
  [K in keyof T]: T[K]["type"] extends "boolean"
    ? boolean
    : T[K]["type"] extends "number"
      ? number
      : string;
};

export interface ToolDef<T extends ArgsDef = ArgsDef> {
  name: string;
  description: string;
  category?: string | string[];
  args?: T;
  /**
   * When true (default), the resolved shell command is shown to the user
   * before execution and they are asked to confirm, go back, or abort.
   * Set to false to skip the confirmation and run immediately.
   */
  askToRun?: boolean;
  /**
   * Run the tool. Return a shell command string to execute it,
   * or handle everything yourself and return void.
   */
  run: (args: InferArgs<T>) => Promise<string | void> | string | void;
}

export interface ToolsConfig {
  name?: string;
  description?: string;
  version?: string;
}
