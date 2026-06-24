import * as path from 'node:path';

import type { Metafile } from 'esbuild';

import type { TypeStats } from './types.ts';

type TypeInputFilePath = string;
type TypeOutputFilePath = string;

export const getStats = ({ inputs, outputs }: Metafile, extensionsSet: Set<string>): TypeStats => {
  const stats: TypeStats = {
    assets: [],
    modules: [],
  };

  /**
   * Filter outputs so they have valid extensions and valid children
   *
   */

  const outputsFilteredEntries = Object.entries(outputs).filter(
    ([outputFilePath, outputChunkData]) => {
      const outputFileExt = path.parse(outputFilePath).ext;

      const hasValidChildren =
        Object.keys(outputChunkData.inputs).length > 0 &&
        Object.keys(outputChunkData.inputs).some((inputFilePath) => {
          const inputFileExt = path.parse(inputFilePath).ext;

          return extensionsSet.has(inputFileExt);
        });

      return extensionsSet.has(outputFileExt) && hasValidChildren;
    }
  );

  /**
   * Visualization should be grouped by output files,
   * so first we need to connect each input file to the corresponding output files
   *
   * it's just an optimization of On3 complexity to On2
   *
   */

  const chunksIndexed: Record<TypeInputFilePath, Array<TypeOutputFilePath>> = {};
  const chunksSizesInOutput: Record<TypeInputFilePath, number> = {};

  outputsFilteredEntries.forEach(([outputFilePath, outputChunkData]) => {
    Object.entries(outputChunkData.inputs).forEach(([inputFilePath, { bytesInOutput }]) => {
      chunksIndexed[inputFilePath] ??= [];
      chunksIndexed[inputFilePath].push(outputFilePath);

      chunksSizesInOutput[inputFilePath] = bytesInOutput;
    });
  });

  /**
   * Filter inputs so they have valid extensions and outputted in some file
   *
   */

  const inputsFilteredEntries = Object.entries(inputs).filter(([inputFilePath]) => {
    const inputFileExt = path.parse(inputFilePath).ext;

    return extensionsSet.has(inputFileExt) && chunksIndexed[inputFilePath]?.length > 0;
  });

  /**
   * Some package managers like to build a huge tree structure of folders like pnpm
   * ex. node_modules/.pnpm/dk-mobx-restore-state@3.4.5_mobx@6.13.0/node_modules/dk-mobx-restore-state
   *
   * so let's take the final part only
   *
   */

  stats.modules = inputsFilteredEntries.map(([inputFilePath, { bytes }]) => {
    const name = `./${inputFilePath.replace(/(.*)?node_modules/, 'node_modules')}`;

    return {
      id: name,
      name,
      size: chunksSizesInOutput[inputFilePath] || bytes,
      chunks: chunksIndexed[inputFilePath],
    };
  });

  stats.assets = outputsFilteredEntries.map(([outputFilePath]) => ({
    name: outputFilePath,
    chunks: [outputFilePath],
  }));

  return stats;
};
