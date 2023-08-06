import * as React from 'react'
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
}

type State = {
    activeItemIndex: number
    closingTimeout: number | undefined
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

export function Autocomplete<T>(props: Props<T>): JSX.Element {
  const [state, setState] = React.useState<State>({
    activeItemIndex: 0,
    closingTimeout: undefined,
    open: false,
  });

  function closeImmediate() {
    window.clearTimeout(state.closingTimeout);
    setState({
      activeItemIndex: 0,
      closingTimeout: undefined,
      open: false,
    });
  }

  function closeSoonish() {
    window.clearTimeout(state.closingTimeout);
    setState({
      // changing this index during close looks weird.
      // better to do it when we open the thing.
      activeItemIndex: state.activeItemIndex,
      closingTimeout: window.setTimeout(() => {
        setState({
          activeItemIndex: 0,
          closingTimeout: undefined,
          open: false,
        });
      }, 100),
      open: state.open,
    });
  }

  React.useEffect(() => {
    return () => {
      window.clearTimeout(state.closingTimeout);
    };
  }, [])

  const items = state.open
    ? filterItems(props.data, item => props.itemMatches(item, props.value), props.maxMatchCount)
    : filterItems(props.data, () => true, props.maxMatchCount);

  props.sortItems?.(items);

  return (
    <div className="position-relative">
      <input
        className="form-control"
        disabled={props.disabled}
        onChange={props.onChange}
        onClick={event => {
          window.clearTimeout(state.closingTimeout);
          setState({
            activeItemIndex: 0,
            closingTimeout: undefined,
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
        onBlur={event => {
          closeSoonish();
        }}
        placeholder={props.placeholder}
        tabIndex={props.tabIndex}
        type="text"
        value={props.value}
      />
      {
        state.open
          ? (
            <div style={dropdownStyle}>
              <div className="list-group">
                {items.map((item, i) => {
                  const isActiveClazz = i === state.activeItemIndex
                    ? 'active'
                    : ''

                  return (
                    <button
                      key={i}
                      className={`list-group-item list-group-item-action ${isActiveClazz}`}
                      onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()

                        const item = items[i];
                        if (item) {
                          props.onItemSelected(item);
                        }
                        closeImmediate();
                      }}
                      tabIndex={-1}
                    >
                      {props.renderItem(item)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
          : null
      }
    </div>
  )
}
