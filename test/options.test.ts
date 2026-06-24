import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pluginWebpackAnalyzer } from '../src/index.ts';

const nonObjects = [0, true, null, '', [], () => false];
const nonArrays = [0, true, null, '', {}, () => false];
const nonStrings = [0, true, null, [], () => false, {}];
const nonNumbers = ['', true, null, [], () => false, {}];
const nonFunctions = ['', null, [], {}, 0, false];

void describe('Validate options', async () => {
  await it('options should be an object or undefined', () => {
    assert.doesNotThrow(() => pluginWebpackAnalyzer());
    assert.doesNotThrow(() => pluginWebpackAnalyzer({}));

    nonObjects.forEach((value: any) => {
      assert.throws(() => pluginWebpackAnalyzer(value), {
        message: '@espcom/esbuild-plugin-webpack-analyzer: Options must be a plain object',
      });
    });
  });

  await it('options.host should be a full string or undefined', () => {
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ host: undefined }));
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ host: '1' }));
    assert.throws(() => pluginWebpackAnalyzer({ host: '' }), {
      message:
        '@espcom/esbuild-plugin-webpack-analyzer: The "host" parameter must be a non-empty string',
    });

    nonStrings.forEach((value: any) => {
      assert.throws(() => pluginWebpackAnalyzer({ host: value }), {
        message: '@espcom/esbuild-plugin-webpack-analyzer: The "host" parameter must be a string',
      });
    });
  });

  await it('options.port should be a number or undefined', () => {
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ port: undefined }));
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ port: 0 }));

    nonNumbers.forEach((value: any) => {
      assert.throws(() => pluginWebpackAnalyzer({ port: value }), {
        message: '@espcom/esbuild-plugin-webpack-analyzer: The "port" parameter must be a number',
      });
    });
  });

  await it('options.extensions should be an array with strings started with a dot', () => {
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ extensions: undefined }));
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ extensions: [] }));
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ extensions: ['.js', '.css'] }));

    assert.throws(() => pluginWebpackAnalyzer({ extensions: ['js'] }), {
      message:
        '@espcom/esbuild-plugin-webpack-analyzer: Each extension in "extensions" parameter must start from a dot',
    });

    nonArrays.forEach((value: any) => {
      assert.throws(
        () => pluginWebpackAnalyzer({ extensions: value }),
        {
          message:
            '@espcom/esbuild-plugin-webpack-analyzer: The "extensions" parameter must be an array',
        },
        `${value} should throw`
      );
    });

    nonStrings.forEach((value: any) => {
      assert.throws(
        () => pluginWebpackAnalyzer({ extensions: [value] }),
        {
          message:
            '@espcom/esbuild-plugin-webpack-analyzer: The "extensions" parameter must be an array of strings',
        },
        `${value} should throw`
      );
    });
  });

  await it('options.getAnalyzerServer should be a function or undefined', () => {
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ getStartResponse: undefined }));
    assert.doesNotThrow(() => pluginWebpackAnalyzer({ getStartResponse: () => undefined }));

    nonFunctions.forEach((value: any) => {
      assert.throws(() => pluginWebpackAnalyzer({ getStartResponse: value }), {
        message:
          '@espcom/esbuild-plugin-webpack-analyzer: The "getStartResponse" parameter must be a function',
      });
    });
  });
});
