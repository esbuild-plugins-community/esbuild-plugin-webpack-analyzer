import { Component, createRef } from 'preact';

import * as styles from './Dropdown.css';

interface DropdownProps {
  label: string;
  options: Array<string>;
  onSelectionChange: (option: string | undefined) => void;
}

interface DropdownState {
  query: string;
  showOptions: boolean;
}

export default class Dropdown extends Component<DropdownProps, DropdownState> {
  input = createRef<HTMLInputElement>();

  state: DropdownState = {
    query: '',
    showOptions: false,
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside, true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  render() {
    const { label, options } = this.props;

    const filteredOptions = this.state.query
      ? options.filter((option) => option.toLowerCase().includes(this.state.query.toLowerCase()))
      : options;

    return (
      <div className={styles.container}>
        <div className={styles.label}>{label}:</div>
        <div>
          <input
            ref={this.input}
            className={styles.input}
            type="text"
            value={this.state.query}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
          />
          {this.state.showOptions ? (
            <div>
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={styles.option}
                  onClick={this.getOptionClickHandler(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  handleClickOutside = (event: MouseEvent) => {
    const el = this.input.current;
    if (el && event && !el.contains(event.target as Node)) {
      this.setState({ showOptions: false });
      if (this.state.query && !this.props.options.includes(this.state.query)) {
        this.setState({ query: '' });
        this.props.onSelectionChange(undefined);
      }
    }
  };

  handleInput = (event: Event) => {
    const { value } = event.target as HTMLInputElement;
    this.setState({ query: value });
    if (!value) {
      this.props.onSelectionChange(undefined);
    }
  };

  handleFocus = () => {
    this.input.current!.value = this.state.query;
    this.setState({ showOptions: true });
  };

  getOptionClickHandler = (option: string) => () => {
    this.props.onSelectionChange(option);
    this.setState({ query: option, showOptions: false });
  };
}
