import { Component } from 'preact';

import Button from './Button.tsx';
import type { SwitcherItem as SwitcherItemType } from './types.ts';

interface SwitcherItemProps {
  active: boolean;
  item: SwitcherItemType;
  onClick: (item: SwitcherItemType) => void;
  className?: string;
}

interface SwitcherItemState {
  [key: string]: unknown;
}

export default class SwitcherItem extends Component<SwitcherItemProps, SwitcherItemState> {
  render({ item, ...props }: SwitcherItemProps) {
    return (
      <Button {...props} onClick={this.handleClick}>
        {item.label}
      </Button>
    );
  }

  handleClick = () => {
    this.props.onClick(this.props.item);
  };
}
