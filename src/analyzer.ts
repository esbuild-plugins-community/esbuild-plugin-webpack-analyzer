import fs from 'node:fs';
import * as path from 'node:path';
import zlib from 'node:zlib';

import type { Metafile } from 'esbuild';

import { buildChartGroups } from './tree.ts';
import type { TypeChartData } from './types.ts';

export type ViewerData = {
  chartData: TypeChartData;
  entrypoints: Array<string>;
};

function getOutputGzipSize(outputPath: string): number | undefined {
  if (!fs.existsSync(outputPath)) return undefined;
  return zlib.gzipSync(fs.readFileSync(outputPath), { level: 9 }).length;
}

function getInputGzipSize(
  inputSize: number,
  outputStatSize: number,
  outputGzipSize: number | undefined
): number | undefined {
  if (!inputSize || !outputStatSize || !outputGzipSize) return undefined;
  return Math.max(1, Math.round((outputGzipSize * inputSize) / outputStatSize));
}

function normalizePath(inputPath: string): string {
  return `./${inputPath.replace(/(.*)?node_modules/, 'node_modules')}`;
}

export function getViewerData(metafile: Metafile, extensionsSet: Set<string>): ViewerData {
  const { outputs } = metafile;

  const outputEntries = Object.entries(outputs).filter(([outputPath, outputData]) => {
    const hasIncludedOutputExt = extensionsSet.has(path.parse(outputPath).ext);
    const hasIncludedInputs = Object.keys(outputData.inputs).some((inputPath) =>
      extensionsSet.has(path.parse(inputPath).ext)
    );
    return hasIncludedOutputExt && hasIncludedInputs;
  });

  const outputPathsSet = new Set(outputEntries.map(([p]) => p));

  const collectStaticOutputImports = (outputPath: string, collected = new Set<string>()) => {
    outputs[outputPath]?.imports.forEach((imp) => {
      if (imp.kind !== 'import-statement') return;
      if (!outputPathsSet.has(imp.path)) return;
      if (collected.has(imp.path)) return;
      collected.add(imp.path);
      collectStaticOutputImports(imp.path, collected);
    });
    return collected;
  };

  const outputToInitialByEntryPoint: Record<string, Record<string, boolean>> = {};
  const entrypoints: Array<string> = [];

  for (const [outputPath, outputData] of outputEntries) {
    if (!outputData.entryPoint) continue;

    const name = outputData.entryPoint;
    entrypoints.push(name);

    const entryOutputPaths = [outputPath, ...collectStaticOutputImports(outputPath)];
    for (const p of entryOutputPaths) {
      outputToInitialByEntryPoint[p] ??= {};
      outputToInitialByEntryPoint[p][name] = true;
    }
  }

  const chartData: TypeChartData = outputEntries.map(([outputPath, outputData]) => {
    const outputGzipSize = getOutputGzipSize(outputPath);

    const outputInputEntries = Object.entries(outputData.inputs).filter(([inputPath]) =>
      extensionsSet.has(path.parse(inputPath).ext)
    );

    const outputStatSize = outputInputEntries.reduce(
      (sum, [, { bytesInOutput }]) => sum + bytesInOutput,
      0
    );

    const treeInputs = outputInputEntries.map(([inputPath, { bytesInOutput }]) => ({
      path: normalizePath(inputPath),
      size: bytesInOutput,
      gzipSize: getInputGzipSize(bytesInOutput, outputStatSize, outputGzipSize),
    }));

    const groups = buildChartGroups(treeInputs);
    const statSize = treeInputs.reduce((sum, i) => sum + i.size, 0);

    return {
      label: outputPath,
      isAsset: true as const,
      statSize: statSize || outputData.bytes,
      gzipSize: outputGzipSize,
      groups,
      isInitialByEntrypoint: outputToInitialByEntryPoint[outputPath] ?? {},
    };
  });

  return { chartData, entrypoints };
}
