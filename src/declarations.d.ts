declare module 'webpack-bundle-analyzer' {
  import { TypeStartResponse, TypeStats } from './types.ts';

  export const start: (
    stats: TypeStats,
    options: {
      analyzerUrl: (params: { listenHost: string; boundAddress: { port: number } }) => string;
      port: number;
      host: string;
      openBrowser: boolean;
      reportTitle: string;
      entrypoints?: Array<string>;
    }
  ) => Promise<TypeStartResponse>;
}
