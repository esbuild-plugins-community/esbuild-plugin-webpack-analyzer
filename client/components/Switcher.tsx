import { Component } from 'preact';

import * as styles from './Switcher.css';
import SwitcherItem from './SwitcherItem.tsx';
import type { SwitcherItem as SwitcherItemType } from './types.ts';

interface SwitcherProps {
  label: string;
  items: Array<SwitcherItemType>;
  activeItem: SwitcherItemType;
  onSwitch: (item: SwitcherItemType) => void;
}

interface SwitcherState {
  [key: string]: unknown;
}

export default class Switcher extends Component<SwitcherProps, SwitcherState> {
  render() {
    const { label, items, activeItem, onSwitch } = this.props;

    return (
      <div className={styles.container}>
        <div className={styles.label}>{label}:</div>
        <div>
          {items.map((item) => (
            <SwitcherItem
              key={item.label}
              className={styles.item}
              item={item}
              active={item === activeItem}
              onClick={onSwitch}
            />
          ))}
        </div>
      </div>
    );
  }
}
