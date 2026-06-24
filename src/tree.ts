import type { TypeFolderChartData, TypeModuleChartData } from './types.ts';

export type TreeInput = {
  path: string;
  size: number;
  gzipSize?: number;
};

type FolderNode = {
  children: Record<string, FolderNode>;
  modules: Array<{ name: string; data: TreeInput }>;
};

function createNode(): FolderNode {
  return { children: Object.create(null), modules: [] };
}

function folderToChartData(
  node: FolderNode,
  name: string,
  parentPath: string
): TypeFolderChartData {
  let mergedName = name;
  let current = node;

  while (Object.keys(current.children).length === 1 && current.modules.length === 0) {
    const childName = Object.keys(current.children)[0];
    mergedName += `/${childName}`;
    current = current.children[childName];
  }

  const path = `${parentPath}/${mergedName}`;
  const groups = nodeToGroups(current, path);

  let statSize = 0;
  let gzipSize = 0;

  for (const group of groups) {
    statSize += group.statSize || 0;
    gzipSize += group.gzipSize || 0;
  }

  return {
    label: mergedName,
    path,
    statSize,
    gzipSize: gzipSize || undefined,
    groups,
  };
}

function nodeToGroups(
  node: FolderNode,
  basePath: string
): Array<TypeFolderChartData | TypeModuleChartData> {
  const groups: Array<TypeFolderChartData | TypeModuleChartData> = [];

  for (const [name, child] of Object.entries(node.children)) {
    groups.push(folderToChartData(child, name, basePath));
  }

  for (const mod of node.modules) {
    groups.push({
      id: mod.data.path,
      label: mod.name,
      path: `${basePath}/${mod.name}`,
      statSize: mod.data.size,
      gzipSize: mod.data.gzipSize,
    });
  }

  return groups;
}

export function buildChartGroups(
  inputs: Array<TreeInput>
): Array<TypeFolderChartData | TypeModuleChartData> {
  const root = createNode();

  for (const input of inputs) {
    const parts = input.path.replace(/^\.\//, '').split('/');
    if (!parts.length) continue;

    const fileName = parts.pop()!;
    let current = root;

    for (const folder of parts) {
      current.children[folder] ??= createNode();
      current = current.children[folder];
    }

    current.modules.push({ name: fileName, data: input });
  }

  return nodeToGroups(root, '.');
}
