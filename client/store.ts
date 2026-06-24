import { action, computed, makeObservable, observable } from 'mobx';

import type { Group, SizeType, ViewerDataItem } from './components/types.ts';
import localStorage from './localStorage.ts';
import { hasSize, walkModules } from './utils.ts';

type AnyModule = ViewerDataItem | Group;

interface FoundByChunk {
  chunk: ViewerDataItem;
  modules: Array<AnyModule>;
}

export class Store {
  cid = 0;

  sizes = new Set<SizeType>(['statSize', 'gzipSize']);

  allChunks: Array<ViewerDataItem> = [];

  selectedChunks: Array<ViewerDataItem> = [];

  searchQuery = '';

  defaultSize: SizeType = 'statSize';

  selectedSize: SizeType | undefined = undefined;

  entrypoints: Array<string> = [];

  darkMode: boolean = (() => {
    const systemPrefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;

    try {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
    } catch {
      // Some browsers might not have localStorage available and we can fail silently
    }

    return systemPrefersDark;
  })();

  constructor() {
    makeObservable(this, {
      allChunks: observable.ref,
      selectedChunks: observable.shallow,
      searchQuery: observable,
      defaultSize: observable,
      selectedSize: observable,
      darkMode: observable,

      toggleDarkMode: action,
      setModules: action,
      setSelectedChunks: action,
      setSelectedSize: action,
      setSearchQuery: action,

      availableSizes: computed,
      activeSize: computed,
      visibleChunks: computed,
      allChunksSelected: computed,
      totalChunksSize: computed,
      searchQueryRegexp: computed,
      isSearching: computed,
      foundModulesByChunk: computed,
      foundModules: computed,
      hasFoundModules: computed,
      foundModulesSize: computed,
    });
  }

  setModules(modules: Array<ViewerDataItem>): void {
    walkModules(modules, (module) => {
      module.cid = this.cid++;
    });

    this.allChunks = modules;
    this.selectedChunks = this.allChunks;
  }

  setEntrypoints(entrypoints: Array<string>): void {
    this.entrypoints = entrypoints;
  }

  get availableSizes(): Set<SizeType> {
    return new Set([
      'statSize',
      ...[...this.sizes].filter(
        (size) => size !== 'statSize' && this.allChunks.some((chunk) => hasSize(chunk, size))
      ),
    ]);
  }

  setSelectedSize(selectedSize: SizeType): void {
    this.selectedSize = selectedSize;
  }

  get activeSize(): SizeType {
    const activeSize = this.selectedSize || this.defaultSize;

    if (!this.availableSizes.has(activeSize)) {
      return 'statSize';
    }

    return activeSize;
  }

  setSelectedChunks(chunks: Array<ViewerDataItem>): void {
    this.selectedChunks = chunks;
  }

  get visibleChunks(): Array<ViewerDataItem> {
    const visibleChunks = this.allChunks.filter((chunk) => this.selectedChunks.includes(chunk));

    return this.filterModulesForSize(visibleChunks, this.activeSize);
  }

  get allChunksSelected(): boolean {
    return this.visibleChunks.length === this.allChunks.length;
  }

  get totalChunksSize(): number {
    return this.allChunks.reduce(
      (totalSize, chunk) => totalSize + ((chunk[this.activeSize] as number) || 0),
      0
    );
  }

  get searchQueryRegexp(): RegExp | null {
    const query = this.searchQuery.trim();

    if (!query) {
      return null;
    }

    try {
      return new RegExp(query, 'iu');
    } catch {
      return null;
    }
  }

  get isSearching(): boolean {
    return Boolean(this.searchQueryRegexp);
  }

  get foundModulesByChunk(): Array<FoundByChunk> {
    if (!this.isSearching) {
      return [];
    }

    const query = this.searchQueryRegexp!;

    return this.visibleChunks
      .map((chunk) => {
        let foundGroups: Array<Array<AnyModule>> = [];

        walkModules(chunk.groups, (module) => {
          let weight = 0;

          if (query.test(module.label)) {
            weight += 3;
          } else if (module.path && query.test(module.path as string)) {
            weight++;
          }

          if (!weight) return;

          if (!module.groups) {
            weight += 1;
          }

          const foundModules = (foundGroups[weight - 1] = foundGroups[weight - 1] || []);
          foundModules.push(module);
        });

        const { activeSize } = this;

        // Filtering out missing groups
        foundGroups = foundGroups.filter(Boolean).reverse();
        // Sorting each group by active size
        for (const modules of foundGroups) {
          modules.sort((m1, m2) => (m2[activeSize] as number) - (m1[activeSize] as number));
        }

        return {
          chunk,
          modules: foundGroups.flat(),
        };
      })
      .filter((result) => result.modules.length > 0)
      .slice()
      .sort((c1: FoundByChunk, c2: FoundByChunk) => c1.modules.length - c2.modules.length);
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query;
  }

  get foundModules(): Array<AnyModule> {
    return this.foundModulesByChunk.reduce((arr: Array<AnyModule>, chunk) => {
      arr.push(...chunk.modules);
      return arr;
    }, []);
  }

  get hasFoundModules(): boolean {
    return this.foundModules.length > 0;
  }

  get foundModulesSize(): number {
    return this.foundModules.reduce(
      (summ, module) => summ + ((module[this.activeSize] as number | undefined) || 0),
      0
    );
  }

  filterModulesForSize(modules: Array<ViewerDataItem>, sizeProp: SizeType): Array<ViewerDataItem> {
    return modules.reduce((filteredModules: Array<ViewerDataItem>, module) => {
      if (hasSize(module, sizeProp)) {
        let current = module;
        if (current.groups) {
          current = {
            ...current,
            groups: this.filterModulesForSize(current.groups as Array<ViewerDataItem>, sizeProp),
          };
        }

        current.weight = current[sizeProp] as number;
        filteredModules.push(current);
      }

      return filteredModules;
    }, []);
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    try {
      localStorage.setItem('darkMode', this.darkMode);
    } catch {
      // Some browsers might not have localStorage available and we can fail silently
    }
    this.updateTheme();
  }

  updateTheme(): void {
    if (this.darkMode) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }
}

export const store = new Store();
