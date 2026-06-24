import * as fs from 'node:fs';
import * as path from 'node:path';

// @ts-ignore
import globalPkg from '../package.json' with { type: 'json' };

const releasePkg = {
  name: globalPkg.name,
  author: globalPkg.author,
  license: globalPkg.license,
  version: globalPkg.version,
  description: globalPkg.description,
  repository: globalPkg.repository,
  type: 'module',
  sideEffects: false,
  dependencies: globalPkg.dependencies,
  peerDependencies: globalPkg.peerDependencies,
  exports: globalPkg.exports,
  types: globalPkg.types,
  engines: globalPkg.engines,
};

fs.writeFileSync(
  path.resolve('./dist/package.json'),
  `${JSON.stringify(releasePkg, null, 2)}\n`,
  'utf8'
);

fs.cpSync(path.resolve('README.md'), path.resolve('dist/README.md'));
