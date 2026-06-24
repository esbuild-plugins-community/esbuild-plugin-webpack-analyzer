import { Component, type ComponentChildren } from 'preact';

import Button from './Button.tsx';
import Icon from './Icon.tsx';
import * as styles from './Sidebar.css';
import ThemeToggle from './ThemeToggle.tsx';

const toggleTime = 200;

interface SidebarProps {
  pinned: boolean;
  position?: string;
  onToggle: (visible?: boolean) => void;
  onResize: () => void;
  onPinStateChange: (pinned: boolean) => void;
  children: ComponentChildren;
}

interface SidebarState {
  visible: boolean;
  renderContent: boolean;
}

interface ResizeInfo {
  startPageX: number;
  initialWidth: number;
}

export default class Sidebar extends Component<SidebarProps, SidebarState> {
  static defaultProps = {
    pinned: false,
    position: 'left',
  };

  allowHide = true;
  toggling = false;
  hideContentTimeout: ReturnType<typeof setTimeout> | null = null;
  hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  width: number | null = null;
  node: Element | null = null;
  resizeInfo: ResizeInfo | null = null;

  state: SidebarState = {
    visible: true,
    renderContent: true,
  };

  componentDidMount() {
    this.hideTimeoutId = setTimeout(() => this.toggleVisibility(false), 3000);
  }

  componentWillUnmount() {
    if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
    if (this.hideContentTimeout) clearTimeout(this.hideContentTimeout);
  }

  render() {
    const { position, pinned, children } = this.props;
    const { visible, renderContent } = this.state;

    const className = [
      styles.container,
      pinned ? styles.pinned : '',
      position === 'left' ? styles.left : '',
      visible ? '' : styles.hidden,
      renderContent ? '' : styles.empty,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={this.saveNode}
        className={className}
        onClick={this.handleClick}
        onMouseLeave={this.handleMouseLeave}
      >
        <ThemeToggle />
        {visible && (
          <Button
            type="button"
            title="Pin"
            className={styles.pinButton}
            active={pinned}
            toggle
            onClick={this.handlePinButtonClick}
          >
            <Icon name="pin" size={13} />
          </Button>
        )}
        <Button
          type="button"
          title={visible ? 'Hide' : 'Show sidebar'}
          className={styles.toggleButton}
          onClick={this.handleToggleButtonClick}
        >
          <Icon name="arrow-right" size={10} rotate={visible ? 180 : 0} />
        </Button>
        {pinned && visible && (
          <div className={styles.resizer} onMouseDown={this.handleResizeStart} />
        )}
        <div
          className={styles.content}
          onMouseEnter={this.handleMouseEnter}
          onMouseMove={this.handleMouseMove}
        >
          {renderContent ? children : null}
        </div>
      </div>
    );
  }

  handleClick = () => {
    this.allowHide = false;
  };

  handleMouseEnter = () => {
    if (!this.toggling && !this.props.pinned) {
      if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
      this.toggleVisibility(true);
    }
  };

  handleMouseMove = () => {
    this.allowHide = true;
  };

  handleMouseLeave = () => {
    if (this.allowHide && !this.toggling && !this.props.pinned) {
      this.toggleVisibility(false);
    }
  };

  handleToggleButtonClick = () => {
    this.toggleVisibility();
  };

  handlePinButtonClick = () => {
    const pinned = !this.props.pinned;
    this.width = pinned ? this.node!.getBoundingClientRect().width : null;
    this.updateNodeWidth();
    this.props.onPinStateChange(pinned);
  };

  handleResizeStart = (event: MouseEvent) => {
    this.resizeInfo = {
      startPageX: event.pageX,
      initialWidth: this.width!,
    };
    document.body.classList.add('resizing', 'col');
    document.addEventListener('mousemove', this.handleResize, true);
    document.addEventListener('mouseup', this.handleResizeEnd, true);
  };

  handleResize = (event: MouseEvent) => {
    this.width = this.resizeInfo!.initialWidth + (event.pageX - this.resizeInfo!.startPageX);
    this.updateNodeWidth();
  };

  handleResizeEnd = () => {
    document.body.classList.remove('resizing', 'col');
    document.removeEventListener('mousemove', this.handleResize, true);
    document.removeEventListener('mouseup', this.handleResizeEnd, true);
    this.props.onResize();
  };

  toggleVisibility(flag?: boolean) {
    if (this.hideContentTimeout) clearTimeout(this.hideContentTimeout);

    const { visible } = this.state;
    const { onToggle, pinned } = this.props;

    const nextFlag = flag === undefined ? !visible : flag;

    if (nextFlag === visible && flag !== undefined) {
      return;
    }

    this.setState({ visible: nextFlag });
    this.toggling = true;
    setTimeout(() => {
      this.toggling = false;
    }, toggleTime);

    if (pinned) {
      this.updateNodeWidth(nextFlag ? this.width : null);
    }

    if (nextFlag || pinned) {
      this.setState({ renderContent: nextFlag });
      onToggle(nextFlag);
    } else {
      this.hideContentTimeout = setTimeout(() => {
        this.hideContentTimeout = null;
        this.setState({ renderContent: false });
        onToggle(false);
      }, toggleTime);
    }
  }

  saveNode = (node: Element | null): void => {
    this.node = node;
  };

  updateNodeWidth(width: number | null = this.width) {
    (this.node as HTMLElement).style.width = width ? `${width}px` : '';
  }
}
