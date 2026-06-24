import { Component, type ComponentChildren } from 'preact';

import * as styles from './Button.css';

interface ButtonProps {
  className?: string;
  active?: boolean;
  toggle?: boolean;
  disabled?: boolean;
  onClick: (event: MouseEvent) => void;
  children?: ComponentChildren;
  [key: string]: unknown;
}

interface ButtonState {
  [key: string]: unknown;
}

export default class Button extends Component<ButtonProps, ButtonState> {
  render({ active, className, children, ...props }: ButtonProps) {
    const classes = `${className ? `${className} ` : ''}${styles.button}${active ? ` ${styles.active}` : ''}`;

    return (
      <button
        {...props}
        ref={this.saveRef}
        type="button"
        className={classes}
        disabled={this.disabled}
        onClick={this.handleClick}
      >
        {children}
      </button>
    );
  }

  get disabled(): boolean {
    const { disabled, active, toggle } = this.props;
    return Boolean(disabled || (active && !toggle));
  }

  handleClick = (event: MouseEvent) => {
    if (this.elem) {
      (this.elem as HTMLButtonElement).blur();
    }

    this.props.onClick(event);
  };

  saveRef = (elem: Element | null): void => {
    this.elem = elem;
  };

  elem: Element | null = null;
}
