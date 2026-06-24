import type { Group, SizeType, ViewerDataItem } from './components/types.ts';

type AnyModule = ViewerDataItem | Group;

export function hasSize(module: AnyModule, size: SizeType): boolean {
  return typeof module[size] === 'number';
}

export function formatSize(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex++;
  }

  const maximumFractionDigits = size < 10 && unitIndex > 0 ? 2 : 1;
  return `${new Intl.NumberFormat('en', { maximumFractionDigits }).format(size)} ${units[unitIndex]}`;
}

export function walkModules(
  modules: Array<AnyModule>,
  cb: (module: AnyModule) => boolean | void
): boolean | void {
  for (const module of modules) {
    if (cb(module) === false) return false;

    if (module.groups && walkModules(module.groups, cb) === false) {
      return false;
    }
  }
}

export function elementIsOutside(elem: Node, container: Node): boolean {
  return !(elem === container || container.contains(elem));
}
