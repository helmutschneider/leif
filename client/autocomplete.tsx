import * as React from 'react';
import {KeyCode} from "./types";

type Props<T> = {
  data: ReadonlyArray<T>
  disabled?: boolean
  itemMatches: (item: T, query: string) => boolean
  maxMatchCount: number
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => unknown
  onItemSelected: (item: T) => unknown
  placeholder?: string
  renderItem: (item: T) => React.ReactNode
  sortItems?: (items: Array<T>) => void
  tabIndex?: number
  value: string
}

const dropdownStyle: React.CSSProperties = {
  maxHeight: '500px',
  minWidth: '300px',
  overflowY: 'auto',
  position: 'absolute',
  width: '100%',
  zIndex: 10,
};

type State = {
  activeItemIndex: number
  open: boolean
}

function filterItems<T>(items: ReadonlyArray<T>, fn: (value: T) => boolean, max: number): Array<T> {
  const found: Array<T> = [];
  for (const item of items) {
    if (fn(item)) {
      found.push(item);
    }

    if (found.length === max) {
      break;
    }
  }
  return found;
}

export function Autocomplete<T>(props: Props<T>): React.ReactNode {
  const [state, setState] = React.useState<State>({
    activeItemIndex: 0,
    open: false,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeItemRef = React.useRef<HTMLButtonElement>(null);

  function closeImmediate() {
    setState({
      activeItemIndex: 0,
      open: false,
    });
  }

  React.useEffect(() => {
    function maybeClose(event: PointerEvent): void {
      if (!containerRef.current) {
        return;
      }

      const el = event.target as HTMLElement;

      if (!containerRef.current.contains(el)) {
        closeImmediate();
      }
    }

    window.addEventListener("click", maybeClose);

    return () => {
      window.removeEventListener("click", maybeClose);
    };
  }, []);

  React.useEffect(() => {
    if (!activeItemRef.current) {
      return;
    }
    activeItemRef.current.scrollIntoView({
      behavior: "instant",
      block: "nearest",
    });
  }, [state.activeItemIndex]);

  const items: Array<T> = state.open
    ? filterItems(props.data, item => props.itemMatches(item, props.value), props.maxMatchCount)
    : [];

  props.sortItems?.(items);

  return (
    <div className="position-relative" ref={containerRef}>
      <input
        className="form-control"
        disabled={props.disabled}
        onChange={props.onChange}
        onClick={event => {
          setState({
            activeItemIndex: 0,
            open: true,
          });
        }}
        onKeyDown={event => {
          if (!state.open) {
            setState({
              ...state,
              activeItemIndex: 0,
              open: true,
            });
          }

          switch (event.keyCode) {
            case KeyCode.ArrowDown: {
              const next = (state.activeItemIndex + 1) % items.length;
              setState({
                ...state,
                activeItemIndex: next,
              });
              break;
            }
            case KeyCode.ArrowUp: {
              let next = state.activeItemIndex - 1;
              if (next < 0) {
                next = items.length - 1;
              }
              setState({
                ...state,
                activeItemIndex: next,
              });
              break;
            }
            case KeyCode.Enter: {
              const item = items[state.activeItemIndex];
              if (item) {
                props.onItemSelected(item);
              }
              closeImmediate();
              break;
            }
            case KeyCode.Escape:
              closeImmediate();
              break;
          }
        }}
        placeholder={props.placeholder}
        tabIndex={props.tabIndex}
        type="text"
        value={props.value}
      />
      {state.open && (
        <div style={dropdownStyle}>
          <div className="list-group">
            {items.map((item, i) => {
              const isActiveClazz = i === state.activeItemIndex
                ? 'active'
                : '';

              return (
                <button
                  key={i}
                  className={`list-group-item list-group-item-action ${isActiveClazz}`}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const item = items[i];
                    if (item) {
                      props.onItemSelected(item);
                    }
                    closeImmediate();
                  }}
                  tabIndex={-1}
                  ref={i === state.activeItemIndex ? activeItemRef : undefined}
                >
                  {props.renderItem(item)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
