import { Component, type ComponentChildren } from 'preact';

import * as styles from './Tooltip.css';

interface TooltipProps {
  visible: boolean;
  children: ComponentChildren;
}

interface TooltipState {
  left: number;
  top: number;
}

export default class Tooltip extends Component<TooltipProps, TooltipState> {
  static marginX = 10;
  static marginY = 30;

  mouseCoords = {
    x: 0,
    y: 0,
  };

  state: TooltipState = {
    left: 0,
    top: 0,
  };

  node: Element | null = null;

  componentDidMount() {
    document.addEventListener('mousemove', this.handleMouseMove, true);
  }

  shouldComponentUpdate(nextProps: TooltipProps): boolean {
    return this.props.visible || nextProps.visible;
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove, true);
  }

  render() {
    const { children, visible } = this.props;

    const className = `${styles.container}${visible ? '' : ` ${styles.hidden}`}`;

    return (
      <div ref={this.saveNode} className={className} style={this.getStyle()}>
        {children}
      </div>
    );
  }

  handleMouseMove = (event: MouseEvent) => {
    Object.assign(this.mouseCoords, {
      x: event.pageX,
      y: event.pageY,
    });

    if (this.props.visible) {
      this.updatePosition();
    }
  };

  saveNode = (node: Element | null): void => {
    this.node = node;
  };

  getStyle(): { left: number; top: number } {
    return {
      left: this.state.left,
      top: this.state.top,
    };
  }

  updatePosition() {
    if (!this.props.visible) return;

    const pos = {
      left: this.mouseCoords.x + Tooltip.marginX,
      top: this.mouseCoords.y + Tooltip.marginY,
    };

    const boundingRect = this.node!.getBoundingClientRect();

    if (pos.left + boundingRect.width > window.innerWidth) {
      pos.left = window.innerWidth - boundingRect.width;
    }

    if (pos.top + boundingRect.height > window.innerHeight) {
      pos.top = this.mouseCoords.y - Tooltip.marginY - boundingRect.height;
    }

    this.setState(pos);
  }
}
