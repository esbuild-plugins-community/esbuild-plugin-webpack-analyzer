import { Component, type ComponentChildren } from 'preact';

import * as styles from './CheckboxList.css';
import CheckboxListItem from './CheckboxListItem.tsx';
import type { ViewerDataItem } from './types.ts';

const ALL_ITEM = Symbol('ALL_ITEM');

interface CheckboxListProps {
  label: string;
  renderLabel: (item: ViewerDataItem | symbol) => ComponentChildren;
  items: Array<ViewerDataItem>;
  checkedItems: Array<ViewerDataItem>;
  onChange: (checkedItems: Array<ViewerDataItem>) => void;
}

interface CheckboxListState {
  checkedItems: Array<ViewerDataItem>;
}

export default class CheckboxList extends Component<CheckboxListProps, CheckboxListState> {
  static ALL_ITEM = ALL_ITEM;

  constructor(props: CheckboxListProps) {
    super(props);
    this.state = {
      checkedItems: props.checkedItems || props.items,
    };
  }

  componentWillReceiveProps(newProps: CheckboxListProps) {
    if (newProps.items !== this.props.items) {
      if (this.isAllChecked()) {
        // Preserving `all checked` state
        this.setState({ checkedItems: newProps.items });
        this.informAboutChange(newProps.items);
      } else if (this.state.checkedItems.length) {
        // Checking only items that are in the new `items` array
        const checkedItems = newProps.items.filter((item) =>
          this.state.checkedItems.find((checkedItem) => checkedItem.label === item.label)
        );

        this.setState({ checkedItems });
        this.informAboutChange(checkedItems);
      }
    } else if (newProps.checkedItems !== this.props.checkedItems) {
      this.setState({ checkedItems: newProps.checkedItems });
    }
  }

  render() {
    const { label, items, renderLabel } = this.props;

    return (
      <div className={styles.container}>
        <div className={styles.label}>{label}:</div>
        <div>
          <CheckboxListItem
            item={ALL_ITEM}
            checked={this.isAllChecked()}
            onChange={this.handleToggleAllCheck}
          >
            {renderLabel}
          </CheckboxListItem>
          {items.map((item) => (
            <CheckboxListItem
              key={item.label}
              item={item}
              checked={this.isItemChecked(item)}
              onChange={this.handleItemCheck}
            >
              {renderLabel}
            </CheckboxListItem>
          ))}
        </div>
      </div>
    );
  }

  handleToggleAllCheck = () => {
    const checkedItems = this.isAllChecked() ? [] : this.props.items;
    this.setState({ checkedItems });
    this.informAboutChange(checkedItems);
  };

  handleItemCheck = (item: ViewerDataItem | symbol) => {
    let checkedItems: Array<ViewerDataItem>;

    if (this.isItemChecked(item as ViewerDataItem)) {
      checkedItems = this.state.checkedItems.filter((checkedItem) => checkedItem !== item);
    } else {
      checkedItems = [...this.state.checkedItems, item as ViewerDataItem];
    }

    this.setState({ checkedItems });
    this.informAboutChange(checkedItems);
  };

  isItemChecked(item: ViewerDataItem): boolean {
    return this.state.checkedItems.includes(item);
  }

  isAllChecked(): boolean {
    return this.props.items.length === this.state.checkedItems.length;
  }

  informAboutChange(checkedItems: Array<ViewerDataItem>): void {
    setTimeout(() => this.props.onChange(checkedItems));
  }
}
