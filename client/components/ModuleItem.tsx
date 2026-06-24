import { Component, type ComponentChildren } from 'preact';

import { formatSize } from '../utils.ts';
import * as styles from './ModuleItem.css';
import type { Module, SizeType } from './types.ts';

interface ModuleItemProps {
  module: Module;
  showSize: SizeType;
  highlightedText?: RegExp;
  isVisible: (module: Module) => boolean;
  onClick: (module: Module) => void;
}

interface ModuleItemState {
  visible: boolean;
}

export default class ModuleItem extends Component<ModuleItemProps, ModuleItemState> {
  state: ModuleItemState = {
    visible: true,
  };

  render({ module, showSize }: ModuleItemProps) {
    const invisible = !this.state.visible;
    const classes = `${styles.container} ${styles[this.itemType]}${
      invisible ? ` ${styles.invisible}` : ''
    }`;

    return (
      <div
        className={classes}
        title={invisible ? this.invisibleHint : undefined}
        onClick={this.handleClick}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <span>{this.title}</span>
        {showSize && (
          <>
            {' ('}
            <strong>{formatSize(module[showSize] as number)}</strong>
            {')'}
          </>
        )}
      </div>
    );
  }

  get itemType(): string {
    const { module } = this.props;
    if (!module.path) return 'chunk';
    return module.groups ? 'folder' : 'module';
  }

  get title(): ComponentChildren {
    const { module } = this.props;
    const title = module.path || module.label;
    const term = this.props.highlightedText;

    if (term) {
      const regexp = new RegExp(term.source, 'igu');
      let match: RegExpExecArray | null;
      let lastMatch: RegExpExecArray | null = null;

      do {
        lastMatch = match = regexp.exec(title);
      } while (match);

      if (lastMatch) {
        return (
          <>
            {title.slice(0, lastMatch.index)}
            <strong>{lastMatch[0]}</strong>
            {title.slice(lastMatch.index + lastMatch[0].length)}
          </>
        );
      }
    }

    return title;
  }

  get invisibleHint(): string {
    const itemType = this.itemType.charAt(0).toUpperCase() + this.itemType.slice(1);
    return `${itemType} is not rendered in the treemap because it's too small.`;
  }

  get isVisible(): boolean {
    const { isVisible } = this.props;
    return isVisible ? isVisible(this.props.module) : true;
  }

  handleClick = () => this.props.onClick(this.props.module);

  handleMouseEnter = () => {
    this.setState({ visible: this.isVisible });
  };

  handleMouseLeave = () => {
    this.setState({ visible: true });
  };
}
