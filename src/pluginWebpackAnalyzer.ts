import type { Plugin } from 'esbuild';
import { start } from 'webpack-bundle-analyzer';
import { pluginName } from './constants.ts';
import { getStats } from './getStats.ts';
import type { TypeOptions, TypeStartResponse } from './types.ts';
import { validateOptions } from './validators/validateOptions.ts';
import { validateResult } from './validators/validateResult.ts';
import { validateSetup } from './validators/validateSetup.ts';

export const pluginWebpackAnalyzer = (options?: TypeOptions): Plugin => {
  validateOptions(options);

  const finalOptions: TypeOptions = {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    port: options?.port ?? 8888,
    host: options?.host ?? '127.0.0.1',
    open: options?.open || false,
    extensions: options?.extensions || ['.js', '.cjs', '.mjs', '.ts', '.tsx'],
    getStartResponse: options?.getStartResponse,
  };

  const extensionsSet = new Set(finalOptions.extensions);

  return {
    name: pluginName,
    setup(build) {
      let response: TypeStartResponse | undefined;

      validateSetup(build);

      build.onEnd((resultRaw) => {
        const result = validateResult(resultRaw);

        const stats = getStats(result.metafile, extensionsSet);

        if (response?.updateChartData) {
          response.updateChartData(stats);

          return Promise.resolve();
        }

        // https://github.com/webpack-contrib/webpack-bundle-analyzer
        return start(stats, {
          analyzerUrl: (params) => `http://${params.listenHost}:${params.boundAddress.port}`,
          port: finalOptions.port!,
          host: finalOptions.host!,
          openBrowser: finalOptions.open!,
          reportTitle: 'Analyzer',
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
