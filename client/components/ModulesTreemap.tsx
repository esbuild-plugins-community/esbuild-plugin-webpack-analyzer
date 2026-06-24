import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Component, type ComponentChildren } from 'preact';

import { store } from '../store.ts';
import { formatSize, hasSize } from '../utils.ts';
import CheckboxList from './CheckboxList.tsx';
import Dropdown from './Dropdown.tsx';
import ModulesList from './ModulesList.tsx';
import * as styles from './ModulesTreemap.css';
import Sidebar from './Sidebar.tsx';
import Switcher from './Switcher.tsx';
import Tooltip from './Tooltip.tsx';
import Treemap from './Treemap.tsx';
import type { Module, SizeType, SwitcherItem, ViewerDataItem } from './types.ts';

function getSizeSwitchItems(): Array<SwitcherItem> {
  return [
    { label: 'Stat', prop: 'statSize' },
    { label: 'Gzipped', prop: 'gzipSize' },
  ];
}

interface ModulesTreemapState {
  sidebarPinned: boolean;
  showTooltip: boolean;
  tooltipContent: ComponentChildren;
}

class ModulesTreemap extends Component<Record<string, never>, ModulesTreemapState> {
  state: ModulesTreemapState = {
    sidebarPinned: false,
    showTooltip: false,
    tooltipContent: null,
  };

  treemap: Treemap | null = null;

  constructor() {
    super();

    makeObservable(this, {
      sizeSwitchItems: computed,
      activeSizeItem: computed,
      chunkItems: computed,
      highlightedModules: computed,
      foundModulesInfo: computed,
    });
  }

  render() {
    const { sidebarPinned, showTooltip, tooltipContent } = this.state;

    return (
      <div className={styles.container}>
        <Sidebar
          pinned={sidebarPinned}
          onToggle={this.handleSidebarToggle}
          onPinStateChange={this.handleSidebarPinStateChange}
          onResize={this.handleSidebarResize}
        >
          <div className={styles.sidebarGroup}>
            <Switcher
              label="Treemap sizes"
              items={this.sizeSwitchItems}
              activeItem={this.activeSizeItem}
              onSwitch={this.handleSizeSwitch}
            />
          </div>
          <div className={styles.sidebarGroup}>
            <Dropdown
              label="Filter to initial chunks"
              options={store.entrypoints}
              onSelectionChange={this.handleSelectionChange}
            />
          </div>
          <div className={styles.sidebarGroup}>
            <div className={styles.foundModulesInfo}>{this.foundModulesInfo}</div>
            {store.isSearching && store.hasFoundModules && (
              <div className={styles.foundModulesContainer}>
                {store.foundModulesByChunk.map(({ chunk, modules }) => (
                  <div key={chunk.cid} className={styles.foundModulesChunk}>
                    <div
                      className={styles.foundModulesChunkName}
                      onClick={() => this.treemap!.zoomToGroup(chunk)}
                    >
                      {chunk.label}
                    </div>
                    <ModulesList
                      className={styles.foundModulesList}
                      modules={modules as Array<Module>}
                      showSize={store.activeSize}
                      highlightedText={store.searchQueryRegexp ?? undefined}
                      isModuleVisible={this.isModuleVisible}
                      onModuleClick={this.handleFoundModuleClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {this.chunkItems.length > 1 && (
            <div className={styles.sidebarGroup}>
              <CheckboxList
                label="Show chunks"
                items={this.chunkItems}
                checkedItems={store.selectedChunks}
                renderLabel={this.renderChunkItemLabel}
                onChange={this.handleSelectedChunksChange}
              />
            </div>
          )}
        </Sidebar>
        <Treemap
          ref={this.saveTreemapRef}
          className={styles.map}
          data={store.visibleChunks}
          highlightGroups={this.highlightedModules}
          weightProp={store.activeSize}
          onMouseLeave={this.handleMouseLeaveTreemap}
          onGroupHover={this.handleTreemapGroupHover}
        />
        {tooltipContent && <Tooltip visible={showTooltip}>{tooltipContent}</Tooltip>}
      </div>
    );
  }

  renderModuleSize(module: ViewerDataItem, sizeProp: SizeType): ComponentChildren {
    const size = module[sizeProp] as number | undefined;
    const sizeLabel = this.sizeSwitchItems.find((item) => item.prop === sizeProp)?.label;
    const isActive = store.activeSize === sizeProp;

    return typeof size === 'number' && sizeLabel ? (
      <div key={sizeProp} className={isActive ? styles.activeSize : ''}>
        {sizeLabel} size: <strong>{formatSize(size)}</strong>
      </div>
    ) : null;
  }

  renderChunkItemLabel = (item: ViewerDataItem | symbol): ComponentChildren => {
    const isAllItem = item === CheckboxList.ALL_ITEM;
    const label = isAllItem ? 'All' : (item as ViewerDataItem).label;
    const size = isAllItem
      ? store.totalChunksSize
      : ((item as ViewerDataItem)[store.activeSize] as number);

    return (
      <>
        {label} (<strong>{formatSize(size)}</strong>)
      </>
    );
  };

  get sizeSwitchItems(): Array<SwitcherItem> {
    return getSizeSwitchItems().filter((item) => store.availableSizes.has(item.prop));
  }

  get activeSizeItem(): SwitcherItem {
    return this.sizeSwitchItems.find((item) => item.prop === store.activeSize)!;
  }

  get chunkItems(): Array<ViewerDataItem> {
    const { allChunks, activeSize } = store;
    let chunkItems = [...allChunks];

    if (activeSize !== 'statSize') {
      chunkItems = chunkItems.filter((chunk) => hasSize(chunk, activeSize));
    }

    chunkItems.sort(
      (chunk1, chunk2) => (chunk2[activeSize] as number) - (chunk1[activeSize] as number)
    );

    return chunkItems;
  }

  get highlightedModules(): Set<unknown> {
    return new Set(store.foundModules);
  }

  get foundModulesInfo(): ComponentChildren {
    if (!store.isSearching) {
      return '\u00A0';
    }

    if (store.hasFoundModules) {
      return (
        <>
          <div className={styles.foundModulesInfoItem}>
            Count: <strong>{store.foundModules.length}</strong>
          </div>
          <div className={styles.foundModulesInfoItem}>
            Total size: <strong>{formatSize(store.foundModulesSize)}</strong>
          </div>
        </>
      );
    }

    return `Nothing found${store.allChunksSelected ? '' : ' in selected chunks'}`;
  }

  handleSelectionChange = (selected: string | undefined) => {
    if (!selected) {
      store.setSelectedChunks(store.allChunks);
      return;
    }

    store.setSelectedChunks(
      store.allChunks.filter((chunk) => chunk.isInitialByEntrypoint?.[selected] ?? false)
    );
  };

  handleSidebarToggle = () => {
    if (this.state.sidebarPinned) {
      setTimeout(() => this.treemap!.resize());
    }
  };

  handleSidebarPinStateChange = (pinned: boolean) => {
    this.setState({ sidebarPinned: pinned });
    setTimeout(() => this.treemap!.resize());
  };

  handleSidebarResize = () => {
    this.treemap!.resize();
  };

  handleSizeSwitch = (sizeSwitchItem: SwitcherItem) => {
    store.setSelectedSize(sizeSwitchItem.prop);
  };

  handleSelectedChunksChange = (selectedChunks: Array<ViewerDataItem>) => {
    store.setSelectedChunks(selectedChunks);
  };

  handleMouseLeaveTreemap = () => {
    this.setState({ showTooltip: false });
  };

  handleTreemapGroupHover = (event: Record<string, unknown>) => {
    const group = event.group as ViewerDataItem | undefined;

    if (group) {
      this.setState({
        showTooltip: true,
        tooltipContent: this.getTooltipContent(group),
      });
    } else {
      this.setState({ showTooltip: false });
    }
  };

  handleFoundModuleClick = (module: Module) => this.treemap!.zoomToGroup(module);

  isModuleVisible = (module: Module): boolean => this.treemap!.isGroupRendered(module);

  saveTreemapRef = (treemap: Treemap | null): void => {
    this.treemap = treemap;
  };

  getTooltipContent(module: ViewerDataItem): ComponentChildren {
    if (!module) return null;

    return (
      <div>
        <div>
          <strong>{module.label}</strong>
        </div>
        <br />
        {this.sizeSwitchItems.map((size) => this.renderModuleSize(module, size.prop))}
        {module.path && (
          <div>
            Path: <strong>{module.path as string}</strong>
          </div>
        )}
      </div>
    );
  }
}

export default observer(ModulesTreemap);
