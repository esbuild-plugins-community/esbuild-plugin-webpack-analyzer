import type { Metafile } from 'esbuild';

export type TypeOptions = {
  host?: string;
  port?: number;
  getStartResponse?: (params: {
    updateChartData: (metafile: Metafile) => void;
    http: import('node:http').Server;
  }) => void;
  extensions?: Array<string>;
};

export type TypeModuleChartData = {
  id: string;
  label: string;
  path: string;
  statSize: number | undefined;
  gzipSize: number | undefined;
};

export type TypeFolderChartData = {
  label: string;
  path: string;
  statSize: number;
  gzipSize: number | undefined;
  groups: Array<TypeFolderChartData | TypeModuleChartData>;
};

export type TypeChartDataItem = {
  label: string;
  isAsset: true;
  statSize: number | undefined;
  gzipSize: number | undefined;
  groups: Array<TypeFolderChartData | TypeModuleChartData>;
  isInitialByEntrypoint: Record<string, boolean>;
};

export type TypeChartData = Array<TypeChartDataItem>;
