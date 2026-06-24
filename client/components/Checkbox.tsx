import { Component, type ComponentChildren } from 'preact';

import * as styles from './Checkbox.css';

interface CheckboxProps {
  className?: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  children?: ComponentChildren;
}

export default class Checkbox extends Component<CheckboxProps> {
  render() {
    const { checked, className, children } = this.props;

    return (
      <label className={`${styles.label}${className ? ` ${className}` : ''}`}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={checked}
          onChange={this.handleChange}
        />
        {children && <span className={styles.itemText}>{children}</span>}
      </label>
    );
  }

  handleChange = () => {
    this.props.onChange(!this.props.checked);
  };
}
