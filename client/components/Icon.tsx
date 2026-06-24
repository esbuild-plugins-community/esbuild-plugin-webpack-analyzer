import { Component } from 'preact';

import iconArrowRight from '../assets/icon-arrow-right.svg';
import iconMoon from '../assets/icon-moon.svg';
import iconPin from '../assets/icon-pin.svg';
import iconSun from '../assets/icon-sun.svg';
import * as styles from './Icon.css';

interface IconDef {
  src: string;
  size: [number, number];
}

const ICONS: Record<string, IconDef> = {
  'arrow-right': {
    src: iconArrowRight,
    size: [7, 13],
  },
  pin: {
    src: iconPin,
    size: [12, 18],
  },
  moon: {
    src: iconMoon,
    size: [24, 24],
  },
  sun: {
    src: iconSun,
    size: [24, 24],
  },
};

interface IconProps {
  className?: string;
  name: string;
  size?: number;
  rotate?: number;
}

interface IconState {
  [key: string]: unknown;
}

export default class Icon extends Component<IconProps, IconState> {
  render({ className }: IconProps) {
    return <i className={`${styles.icon}${className ? ` ${className}` : ''}`} style={this.style} />;
  }

  get style(): Record<string, string> {
    const { name, size, rotate } = this.props;
    const icon = ICONS[name];

    if (!icon) throw new TypeError(`Can't find "${name}" icon.`);

    let [width, height] = icon.size;

    if (size) {
      const ratio = size / Math.max(width, height);
      width = Math.min(Math.ceil(width * ratio), size);
      height = Math.min(Math.ceil(height * ratio), size);
    }

    return {
      backgroundImage: `url('${icon.src}')`,
      width: `${width}px`,
      height: `${height}px`,
      transform: rotate ? `rotate(${rotate}deg)` : '',
    };
  }
}
