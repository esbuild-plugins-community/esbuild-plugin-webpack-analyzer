import type { Metafile, Plugin } from 'esbuild';

import { pluginName } from './constants.ts';
import type { TypeOptions } from './types.ts';
import { validateOptions } from './validators/validateOptions.ts';
import { validateResult } from './validators/validateResult.ts';
import { validateSetup } from './validators/validateSetup.ts';
import { startServer } from './viewer.ts';

type StartResponse = {
  updateChartData: (metafile: Metafile) => void;
  http: import('node:http').Server;
};

export const pluginWebpackAnalyzer = (options?: TypeOptions): Plugin => {
  validateOptions(options);

  const finalOptions: TypeOptions = {
    port: options?.port ?? 8888,
    host: options?.host ?? '127.0.0.1',
    extensions: options?.extensions || ['.js', '.cjs', '.mjs', '.ts', '.tsx'],
    getStartResponse: options?.getStartResponse,
  };

  const extensionsSet = new Set(finalOptions.extensions);

  return {
    name: pluginName,
    setup(build) {
      let response: StartResponse | undefined;

      validateSetup(build);

      build.onEnd((resultRaw) => {
        const result = validateResult(resultRaw);

        if (response?.updateChartData) {
          response.updateChartData(result.metafile);
          return;
        }

        return startServer(result.metafile, extensionsSet, {
          port: finalOptions.port!,
          host: finalOptions.host!,
        }).then((res) => {
          response = res;
          finalOptions?.getStartResponse?.(res);
        });
      });

      build.onDispose(() => {
        response?.http?.close();
      });
    },
  };
};
