import type { BuildResult, Metafile } from 'esbuild';

import { pluginName } from '../constants.ts';

export function validateResult(result: BuildResult): BuildResult & { metafile: Metafile } {
  if (!result.metafile || Object.prototype.toString.call(result.metafile) !== '[object Object]') {
    throw new Error(`${pluginName}: "metafile" parameter must be set to "true" is esbuild config`);
  }

  return result as BuildResult & { metafile: Metafile };
}
