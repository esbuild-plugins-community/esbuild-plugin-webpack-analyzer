export type SizeType = 'statSize' | 'gzipSize';

export interface Group {
  cid: number;
  label: string;
  path?: string;
  groups?: Array<Group>;
  statSize: number;
  gzipSize?: number;
  weight?: number;
  [key: string]: unknown;
}

export interface ViewerDataItem {
  cid: number;
  label: string;
  isAsset?: boolean;
  statSize: number;
  gzipSize?: number;
  groups: Array<Group>;
  isInitialByEntrypoint?: Record<string, boolean>;
  weight?: number;
  [key: string]: unknown;
}

export type ViewerData = Array<ViewerDataItem>;

export interface Module {
  cid: number;
  label: string;
  path?: string;
  statSize: number;
  gzipSize?: number;
  weight: number;
  groups?: Array<Group>;
  isAsset?: boolean;
  [key: string]: unknown;
}

export interface SwitcherItem {
  label: string;
  prop: SizeType;
}
