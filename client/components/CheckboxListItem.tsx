import { Component, type ComponentChildren } from 'preact';

import Checkbox from './Checkbox.tsx';
import * as styles from './CheckboxList.css';
import CheckboxList from './CheckboxList.tsx';
import type { ViewerDataItem } from './types.ts';

interface CheckboxListItemProps {
  item: ViewerDataItem | symbol;
  checked?: boolean;
  onChange: (item: ViewerDataItem | symbol) => void;
  children?: (item: ViewerDataItem | symbol) => ComponentChildren;
}

export default class CheckboxListItem extends Component<CheckboxListItemProps> {
  render() {
    return (
      <div className={styles.item}>
        <Checkbox {...this.props} onChange={this.handleChange}>
          {this.renderLabel()}
        </Checkbox>
      </div>
    );
  }

  renderLabel(): ComponentChildren {
    const { children, item } = this.props;
    if (children) {
      return children(item);
    }

    return item === CheckboxList.ALL_ITEM ? 'All' : (item as ViewerDataItem).label;
  }

  handleChange = () => {
    this.props.onChange(this.props.item);
  };
}
