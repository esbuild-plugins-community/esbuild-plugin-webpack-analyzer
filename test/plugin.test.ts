import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it, mock } from 'node:test';

import { type BuildOptions, build, context, type Metafile } from 'esbuild';
import { getStats } from '../src/getStats.ts';
import { pluginWebpackAnalyzer } from '../src/index.ts';
import type { TypeStartResponse } from '../src/types.ts';

void describe('Plugin works', async () => {
  const config: BuildOptions = {
    entryPoints: [path.resolve('test/res/entry.ts')],
    bundle: true,
    format: 'iife',
    logLevel: 'silent',
    write: false,
    metafile: true,
    target: 'node18',
    platform: 'node',
    packages: 'external',
    resolveExtensions: ['.ts'],
    plugins: [],
  };

  await it('analyzer should start', async () => {
    const spyLog = mock.method(console, 'log');

    await build({
      ...config,
      plugins: [pluginWebpackAnalyzer()],
    });

    assert.equal(spyLog.mock.callCount(), 1);

    assert.equal(
      spyLog.mock.calls[0].arguments[0],
      '\x1B[1mWebpack Bundle Analyzer\x1B[22m is started at \x1B[1mhttp://127.0.0.1:8888\x1B[22m\n' +
        'Use \x1B[1mCtrl+C\x1B[22m to close it'
    );

    spyLog.mock.restore();
  });

  await it('analyzer should update stats on rebuild', async () => {
    const spyLog = mock.method(console, 'log');

    let response: TypeStartResponse | undefined;

    const ctx = await context({
      ...config,
      plugins: [
        pluginWebpackAnalyzer({
          getStartResponse(res) {
            response = res;
          },
        }),
      ],
    });

    await ctx.rebuild();

    const spyUpdateChartData = mock.method(response!, 'updateChartData');

    assert.equal(spyLog.mock.callCount(), 1);
    assert.equal(spyUpdateChartData.mock.callCount(), 0);

    assert.equal(
      spyLog.mock.calls[0].arguments[0],
      '\x1B[1mWebpack Bundle Analyzer\x1B[22m is started at \x1B[1mhttp://127.0.0.1:8888\x1B[22m\n' +
        'Use \x1B[1mCtrl+C\x1B[22m to close it'
    );

    await ctx.rebuild();

    assert.equal(spyLog.mock.callCount(), 1);
    assert.equal(spyUpdateChartData.mock.callCount(), 1);

    spyLog.mock.restore();

    await ctx.dispose();
  });

  await it('getStats works correctly', async () => {
    const sampleMetafile: Metafile = {
      inputs: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'test/res/entry.ts': {
          bytes: 110,
          imports: [
            { path: 'istanbul-cobertura-badger', kind: 'import-statement', external: true },
          ],
          format: 'esm',
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'node_modules123/123/node_modules/test/res/entry.ts': {
          bytes: 110,
          imports: [
            { path: 'istanbul-cobertura-badger', kind: 'import-statement', external: true },
          ],
          format: 'esm',
        },
      },
      outputs: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'entry.js': {
          imports: [{ path: 'istanbul-cobertura-badger', kind: 'require-call', external: true }],
          exports: [],
          entryPoint: 'test/res/entry.ts',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          inputs: { 'test/res/entry.ts': { bytesInOutput: 83 } },
          bytes: 1719,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'entry2.js': {
          imports: [{ path: 'istanbul-cobertura-badger', kind: 'require-call', external: true }],
          exports: [],
          entryPoint: 'test/res/entry.ts',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          inputs: { 'test/res/entry.ts': { bytesInOutput: 83 } },
          bytes: 1719,
        },
      },
    };

    assert.deepEqual(getStats(sampleMetafile, new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx'])), {
      assets: [
        {
          chunks: ['entry.js'],
          name: 'entry.js',
        },
        {
          chunks: ['entry2.js'],
          name: 'entry2.js',
        },
      ],
      modules: [
        {
          chunks: ['entry.js', 'entry2.js'],
          id: './test/res/entry.ts',
          name: './test/res/entry.ts',
          size: 83,
        },
      ],
    });

    assert.deepEqual(getStats(sampleMetafile, new Set([])), {
      assets: [],
      modules: [],
    });
  });
});
