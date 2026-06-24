import { observer } from 'mobx-react';
import { Component } from 'preact';

import { store } from '../store.ts';
import Button from './Button.tsx';
import Icon from './Icon.tsx';
import * as styles from './ThemeToggle.css';

class ThemeToggle extends Component {
  render() {
    const { darkMode } = store;

    return (
      <Button
        type="button"
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={styles.themeToggle}
        onClick={this.handleToggle}
      >
        <Icon name={darkMode ? 'sun' : 'moon'} size={16} />
      </Button>
    );
  }

  handleToggle = () => {
    store.toggleDarkMode();
  };
}

export default observer(ThemeToggle);
