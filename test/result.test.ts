import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'node:test';

import { type BuildOptions, build } from 'esbuild';

import { validateResult } from '../src/validators/validateResult.ts';
import { validateSetup } from '../src/validators/validateSetup.ts';

const nonObjects = [0, true, null, '', [], () => false];
const nonTrue = [0, false, null, '', [], () => false, {}];

void describe('Validate result', async () => {
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

  await it('validateSetup throws an error', () => {
    assert.doesNotThrow(() => validateSetup({ initialOptions: { metafile: true } } as any));

    nonTrue.forEach((value: any) => {
      assert.throws(() => validateSetup({ initialOptions: { metafile: value } } as any), {
        message:
          '@espcom/esbuild-plugin-webpack-analyzer: "metafile" parameter must be set to "true" is esbuild config',
      });
    });
  });

  await it('validateResult throws an error', () => {
    assert.doesNotThrow(() => validateResult({ metafile: {} } as any));

    nonObjects.forEach((value: any) => {
      assert.throws(() => validateResult({ metafile: value } as any), {
        message:
          '@espcom/esbuild-plugin-webpack-analyzer: "metafile" parameter must be set to "true" is esbuild config',
      });
    });
  });

  await it('metafile option should be enabled', async () => {
    try {
      await build({ ...config, metafile: false });
    } catch (error: any) {
      assert.match(
        error.message,
        /@espcom\/esbuild-plugin-webpack-analyzer: "metafile" parameter must be set to "true" is esbuild config/
      );
    }
  });
});
