import { pluginName } from '../constants.ts';
import type { TypeOptions } from '../types.ts';

export function validateOptions(options?: TypeOptions) {
  if (typeof options !== 'undefined') {
    if (Object.prototype.toString.call(options) !== '[object Object]') {
      throw new Error(`${pluginName}: Options must be a plain object`);
    }

    if (typeof options.host !== 'undefined') {
      if (typeof options.host !== 'string') {
        throw new Error(`${pluginName}: The "host" parameter must be a string`);
      }
      if (!options.host) {
        throw new Error(`${pluginName}: The "host" parameter must be a non-empty string`);
      }
    }

    if (typeof options.port !== 'undefined') {
      if (typeof options.port !== 'number') {
        throw new Error(`${pluginName}: The "port" parameter must be a number`);
      }
    }

    if (typeof options.extensions !== 'undefined') {
      if (!Array.isArray(options.extensions)) {
        throw new Error(`${pluginName}: The "extensions" parameter must be an array`);
      }

      if (options.extensions.some((ext) => typeof ext !== 'string')) {
        throw new Error(`${pluginName}: The "extensions" parameter must be an array of strings`);
      }

      if (options.extensions.some((ext) => !ext.startsWith('.'))) {
        throw new Error(
          `${pluginName}: Each extension in "extensions" parameter must start from a dot`
        );
      }
    }

    if (typeof options.getStartResponse !== 'undefined') {
      if (typeof options.getStartResponse !== 'function') {
        throw new Error(`${pluginName}: The "getStartResponse" parameter must be a function`);
      }
    }
  }
}
