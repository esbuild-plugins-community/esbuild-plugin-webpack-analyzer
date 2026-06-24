import type { Server } from 'node:http';

export type TypeStartResponse = {
  updateChartData: (params: TypeStats) => void;
  http: Server;
  ws: any;
};

export type TypeOptions = {
  host?: string;
  port?: number;
  open?: boolean;
  getStartResponse?: (params: TypeStartResponse) => void;
  extensions?: Array<string>;
};

export type TypeModule = {
  id: string;
  name: string;
  size: number;
  chunks: Array<string>;
};

export type TypeStats = {
  assets: Array<{ name: string; chunks: Array<string> }>;
  modules: Array<TypeModule>;
};
