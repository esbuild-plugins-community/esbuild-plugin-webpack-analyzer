import FoamTree from '@carrotsearch/foamtree';
import { Component } from 'preact';

import type { SizeType, ViewerDataItem } from './types.ts';

function preventDefault(event: Event) {
  event.preventDefault();
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash &= hash;
  }
  return hash;
}

interface TreemapProps {
  className?: string;
  data: Array<ViewerDataItem>;
  highlightGroups: Set<unknown>;
  weightProp: SizeType;
  onGroupHover?: (event: Record<string, unknown>) => void;
  onMouseLeave?: (event: Record<string, unknown>) => void;
}

export default class Treemap extends Component<TreemapProps> {
  treemap: ReturnType<typeof FoamTree> | null = null;
  zoomOutDisabled = false;
  chunkNamePartIndex = 0;
  node: Element | null = null;

  constructor(props: TreemapProps) {
    super(props);
    this.treemap = null;
    this.zoomOutDisabled = false;
    this.findChunkNamePartIndex();
  }

  componentDidMount() {
    this.treemap = this.createTreemap();
    window.addEventListener('resize', this.resize);
  }

  componentWillReceiveProps(nextProps: TreemapProps) {
    if (nextProps.data !== this.props.data) {
      this.findChunkNamePartIndex();
      this.treemap.set({
        dataObject: this.getTreemapDataObject(nextProps.data),
      });
    } else if (nextProps.highlightGroups !== this.props.highlightGroups) {
      setTimeout(() => this.treemap.redraw());
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
    this.treemap.dispose();
  }

  render() {
    return <div {...this.props} ref={this.saveNodeRef} />;
  }

  saveNodeRef = (node: Element | null): void => {
    this.node = node;
  };

  getTreemapDataObject(data: Array<ViewerDataItem> = this.props.data) {
    return { groups: data };
  }

  createTreemap() {
    const component = this;
    const { props } = this;

    return new FoamTree({
      element: this.node,
      layout: 'squarified',
      stacking: 'flattened',
      pixelRatio: window.devicePixelRatio || 1,
      maxGroups: Infinity,
      maxGroupLevelsDrawn: Infinity,
      maxGroupLabelLevelsDrawn: Infinity,
      maxGroupLevelsAttached: Infinity,
      wireframeLabelDrawing: 'always',
      groupMinDiameter: 0,
      groupLabelVerticalPadding: 0.2,
      rolloutDuration: 0,
      pullbackDuration: 0,
      fadeDuration: 0,
      groupExposureZoomMargin: 0.2,
      zoomMouseWheelDuration: 300,
      openCloseDuration: 200,
      dataObject: this.getTreemapDataObject(),
      titleBarDecorator(_opts: unknown, _props: unknown, vars: Record<string, unknown>) {
        vars.titleBarShown = false;
      },
      groupColorDecorator(
        _options: unknown,
        properties: Record<string, unknown>,
        variables: Record<string, unknown>
      ) {
        const root = component.getGroupRoot(properties.group as Record<string, unknown>);
        const chunkName = component.getChunkNamePart((root as { label: string }).label);
        const hash = /[^0-9]/u.test(chunkName)
          ? hashCode(chunkName)
          : (Number.parseInt(chunkName, 10) / 1000) * 360;
        variables.groupColor = {
          model: 'hsla',
          h: Math.round(Math.abs(hash) % 360),
          s: 60,
          l: 50,
          a: 0.9,
        };

        const { highlightGroups } = component.props;
        const module = properties.group;

        if (highlightGroups?.has(module)) {
          variables.groupColor = {
            model: 'rgba',
            r: 255,
            g: 0,
            b: 0,
            a: 0.8,
          };
        } else if (highlightGroups && highlightGroups.size > 0) {
          (variables.groupColor as Record<string, unknown>).s = 10;
        }
      },
      onGroupClick(event: Record<string, unknown>) {
        preventDefault(event as unknown as Event);
        component.zoomOutDisabled = false;
        (this as { zoom: (g: unknown) => void }).zoom(event.group);
      },
      onGroupDoubleClick: preventDefault,
      onGroupHover(event: Record<string, unknown>) {
        if (
          event.group &&
          ((event.group as Record<string, unknown>).attribution ||
            event.group === (this as { get: (k: string) => unknown }).get('dataObject'))
        ) {
          (event as unknown as Event).preventDefault();
          if (props.onMouseLeave) {
            props.onMouseLeave.call(component, event);
          }
          return;
        }

        if (props.onGroupHover) {
          props.onGroupHover.call(component, event);
        }
      },
      onGroupMouseWheel(event: Record<string, unknown>) {
        const { scale } = (this as { get: (k: string) => { scale: number } }).get('viewport');
        const isZoomOut = (event.delta as number) < 0;

        if (isZoomOut) {
          if (component.zoomOutDisabled) return preventDefault(event as unknown as Event);
          if (scale < 1) {
            component.zoomOutDisabled = true;
            preventDefault(event as unknown as Event);
          }
        } else {
          component.zoomOutDisabled = false;
        }
      },
    });
  }

  getGroupRoot(group: Record<string, unknown>): Record<string, unknown> {
    let current = group;
    let nextParent: Record<string, unknown> | undefined;
    while (
      !current.isAsset &&
      (nextParent = (this.treemap.get('hierarchy', current) as { parent: Record<string, unknown> })
        .parent)
    ) {
      current = nextParent;
    }
    return current;
  }

  zoomToGroup(group: unknown) {
    this.zoomOutDisabled = false;

    let current = group;
    while (current && !(this.treemap.get('state', current) as { revealed: boolean }).revealed) {
      current = (this.treemap.get('hierarchy', current) as { parent: unknown }).parent;
    }

    if (current) {
      this.treemap.zoom(current);
    }
  }

  isGroupRendered(group: unknown): boolean {
    const groupState = this.treemap.get('state', group) as { revealed: boolean } | null;
    return Boolean(groupState) && groupState!.revealed;
  }

  resize = () => {
    this.treemap.resize();
  };

  findChunkNamePartIndex() {
    const splitChunkNames = this.props.data.map((chunk) => chunk.label.split(/[^a-z0-9]/iu));
    const longestSplitName = Math.max(...splitChunkNames.map((parts) => parts.length));
    const namePart = {
      index: 0,
      votes: 0,
    };
    for (let i = longestSplitName - 1; i >= 0; i--) {
      const identifierVotes = {
        name: 0,
        hash: 0,
        ext: 0,
      };
      let lastChunkPart = '';
      for (const splitChunkName of splitChunkNames) {
        const part = splitChunkName[i];
        if (part === undefined || part === '') {
          continue;
        }
        if (part === lastChunkPart) {
          identifierVotes.ext++;
        } else if (
          /[a-z]/u.test(part) &&
          /[0-9]/u.test(part) &&
          part.length === lastChunkPart.length
        ) {
          identifierVotes.hash++;
        } else if (/^[a-z]+$/iu.test(part) || /^[0-9]+$/u.test(part)) {
          identifierVotes.name++;
        }
        lastChunkPart = part;
      }
      if (identifierVotes.name >= namePart.votes) {
        namePart.index = i;
        namePart.votes = identifierVotes.name;
      }
    }
    this.chunkNamePartIndex = namePart.index;
  }

  getChunkNamePart(chunkLabel: string): string {
    return chunkLabel.split(/[^a-z0-9]/iu)[this.chunkNamePartIndex] || chunkLabel;
  }
}
