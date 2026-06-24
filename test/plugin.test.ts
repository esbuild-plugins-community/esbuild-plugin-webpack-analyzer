import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it, mock } from 'node:test';

import { type BuildOptions, build, context, type Metafile } from 'esbuild';
import { getViewerData } from '../src/analyzer.ts';
import { pluginWebpackAnalyzer } from '../src/index.ts';

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
    const spyLog = mock.method(console, 'info');

    await build({
      ...config,
      plugins: [pluginWebpackAnalyzer()],
    });

    assert.equal(spyLog.mock.callCount(), 1);

    assert.equal(
      spyLog.mock.calls[0].arguments[0],
      'Esbuild Bundle Analyzer is started at http://127.0.0.1:8888\nUse Ctrl+C to close it'
    );

    spyLog.mock.restore();
  });

  await it('analyzer should update stats on rebuild', async () => {
    const spyLog = mock.method(console, 'info');

    let response:
      | {
          updateChartData: (...args: Array<any>) => void;
        }
      | undefined;

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
      'Esbuild Bundle Analyzer is started at http://127.0.0.1:8888\nUse Ctrl+C to close it'
    );

    await ctx.rebuild();

    assert.equal(spyLog.mock.callCount(), 1);
    assert.equal(spyUpdateChartData.mock.callCount(), 1);

    spyLog.mock.restore();

    await ctx.dispose();
  });

  await it('getViewerData works correctly', async () => {
    const sampleMetafile: Metafile = {
      inputs: {
        'test/res/entry.ts': {
          bytes: 110,
          imports: [{ path: 'preact', kind: 'import-statement', external: true }],
          format: 'esm',
        },
        'node_modules123/123/node_modules/test/res/entry.ts': {
          bytes: 110,
          imports: [{ path: 'preact', kind: 'import-statement', external: true }],
          format: 'esm',
        },
      },
      outputs: {
        'entry.js': {
          imports: [{ path: 'preact', kind: 'require-call', external: true }],
          exports: [],
          entryPoint: 'test/res/entry.ts',
          inputs: {
            'test/res/entry.ts': { bytesInOutput: 83 },
            'node_modules123/123/node_modules/test/res/entry.ts': { bytesInOutput: 41 },
          },
          bytes: 1719,
        },

        'entry2.js': {
          imports: [{ path: 'preact', kind: 'require-call', external: true }],
          exports: [],
          entryPoint: 'test/res/entry.ts',
          inputs: { 'test/res/entry.ts': { bytesInOutput: 83 } },
          bytes: 1719,
        },
      },
    };

    assert.deepEqual(getViewerData(sampleMetafile, new Set(['.js', '.cjs', '.mjs', '.ts'])), {
      chartData: [
        {
          label: 'entry.js',
          isAsset: true,
          statSize: 124,
          gzipSize: undefined,
          groups: [
            {
              label: 'test/res',
              path: './test/res',
              statSize: 83,
              gzipSize: undefined,
              groups: [
                {
                  id: './test/res/entry.ts',
                  label: 'entry.ts',
                  path: './test/res/entry.ts',
                  statSize: 83,
                  gzipSize: undefined,
                },
              ],
            },
            {
              label: 'node_modules/test/res',
              path: './node_modules/test/res',
              statSize: 41,
              gzipSize: undefined,
              groups: [
                {
                  id: './node_modules/test/res/entry.ts',
                  label: 'entry.ts',
                  path: './node_modules/test/res/entry.ts',
                  statSize: 41,
                  gzipSize: undefined,
                },
              ],
            },
          ],
          isInitialByEntrypoint: { 'test/res/entry.ts': true },
        },
        {
          label: 'entry2.js',
          isAsset: true,
          statSize: 83,
          gzipSize: undefined,
          groups: [
            {
              label: 'test/res',
              path: './test/res',
              statSize: 83,
              gzipSize: undefined,
              groups: [
                {
                  id: './test/res/entry.ts',
                  label: 'entry.ts',
                  path: './test/res/entry.ts',
                  statSize: 83,
                  gzipSize: undefined,
                },
              ],
            },
          ],
          isInitialByEntrypoint: { 'test/res/entry.ts': true },
        },
      ],
      entrypoints: ['test/res/entry.ts', 'test/res/entry.ts'],
    });

    assert.deepEqual(getViewerData(sampleMetafile, new Set([])), {
      chartData: [],
      entrypoints: [],
    });
  });
});
