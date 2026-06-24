## @espcom/esbuild-plugin-webpack-analyzer

[![npm](https://img.shields.io/npm/v/@espcom/esbuild-plugin-webpack-analyzer)](https://www.npmjs.com/package/@espcom/esbuild-plugin-webpack-analyzer)

A ESM-only plugin for [esbuild](https://esbuild.github.io/) that integrates with the 
esbuild metafile and starts a local analyzer UI.
This helps inspect bundle composition and optimize output sizes.

## Installation

First, ensure that you have `esbuild` installed:

```bash
npm install esbuild --save-dev
```

Then, install the plugin:

```bash
npm install @espcom/esbuild-plugin-webpack-analyzer --save-dev
```
getStartResponse
## Usage

To use the plugin, add it to the plugins array in your esbuild configuration. Be sure to place it 
**last**; otherwise, if another plugin modifies the output files, they will not be analyzed:

```javascript
import esbuild from 'esbuild';
import { pluginWebpackAnalyzer } from '@espcom/esbuild-plugin-webpack-analyzer';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/out.js',
  metafile: true,  // Ensure metafile is set to true
  plugins: [
    // other plugins
  
    pluginWebpackAnalyzer() // Configure the plugin as needed
  ],
});
```

## Options

The `pluginWebpackAnalyzer` function accepts an optional configuration object 
with the following properties:

- `host` (string, optional): The host for the analyzer server. Defaults to `'127.0.0.1'`.
- `port` (number, optional): The port for the analyzer server. Defaults to `8888`.
- `getStartResponse` (function, optional): Callback function that receives the response object 
of the analyzer server.
- `extensions` (Array<string>, optional): Which extensions should be included. By default 
`['.js', '.cjs', '.mjs', '.ts', '.tsx']`.

### Example

```javascript
pluginWebpackAnalyzer({
  host: '0.0.0.0',
  port: 3000,
  getStartResponse: (response) => {
    const {
      updateChartData, // function, updates chart data. No need to call manually
      http, // 'node:http' Server
    } = response;
    
    // For example, you may close the server manually
    http.close();
  },
});
```

## How It Works

The plugin reads esbuild's `metafile`, starts a small HTTP server, and serves a bundled custom
viewer from the package. On rebuilds, the existing server updates chart data without restarting.

### Features

- Compatible with all platforms (Linux, Windows, etc.)
- Supports esbuild's code splitting and ESM output
- Custom viewer without `webpack-bundle-analyzer` runtime dependency

### Validation

The plugin includes validation for the following:

- Ensures that the `metafile` option is enabled in esbuild.
- Validates the options provided to the plugin, ensuring types and required fields are correctly set.
