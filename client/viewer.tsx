import { render } from 'preact';

import ModulesTreemap from './components/ModulesTreemap.tsx';
import { store } from './store.ts';

import './viewer.css';

declare global {
  var chartData: import('./components/types.ts').ViewerData;
  var entrypoints: Array<string>;
}

window.addEventListener(
  'load',
  () => {
    store.setModules(globalThis.chartData);
    store.setEntrypoints(globalThis.entrypoints);
    store.updateTheme();
    render(<ModulesTreemap />, document.querySelector('#app')!);

    const events = new EventSource('/events');
    events.addEventListener('chartDataUpdated', (event) => {
      const data = JSON.parse(
        (event as MessageEvent).data
      ) as import('./components/types.ts').ViewerData;
      store.setModules(data);
    });
  },
  false
);
