import { Component } from 'preact';

import ModuleItem from './ModuleItem.tsx';
import * as styles from './ModulesList.css';
import type { Module, SizeType } from './types.ts';

interface ModulesListProps {
  className?: string;
  modules: Array<Module>;
  showSize: SizeType;
  highlightedText?: RegExp;
  isModuleVisible: (module: Module) => boolean;
  onModuleClick: (module: Module) => void;
}

interface ModulesListState {
  [key: string]: unknown;
}

export default class ModulesList extends Component<ModulesListProps, ModulesListState> {
  render({ modules, showSize, highlightedText, isModuleVisible, className }: ModulesListProps) {
    return (
      <div className={`${styles.container}${className ? ` ${className}` : ''}`}>
        {modules.map((module) => (
          <ModuleItem
            key={module.cid}
            module={module}
            showSize={showSize}
            highlightedText={highlightedText}
            isVisible={isModuleVisible}
            onClick={this.handleModuleClick}
          />
        ))}
      </div>
    );
  }

  handleModuleClick = (module: Module) => this.props.onModuleClick(module);
}
