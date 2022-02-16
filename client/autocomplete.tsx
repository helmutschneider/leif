import * as React from 'react'
import {KeyCode} from "./types";

type Props<T> = {
    data: ReadonlyArray<T>
    disabled?: boolean
    itemMatches: (item: T, query: string) => boolean
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => unknown
    onItemSelected: (item: T) => unknown
    renderItem: (item: T) => React.ReactNode
    value: string
}

const dropdownStyle: React.CSSProperties = {
    maxHeight: '500px',
    overflowY: 'scroll',
    position: 'absolute',
    width: '300px',
    zIndex: 10,
}

type State = {
    activeItemIndex: number
    closingTimeout: number | undefined
    open: boolean
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
            activeItemIndex: 0,
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
        ? props.data.filter(item => props.itemMatches(item, props.value))
        : props.data;

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
                            open: true,
                        })
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
                        case KeyCode.Enter:
                            const item = items[state.activeItemIndex];
                            if (item) {
                                props.onItemSelected(item);
                            }
                            closeImmediate();
                            break;
                        case KeyCode.Escape:
                            closeImmediate();
                            break;
                    }
                }}
                onBlur={event => {
                    closeSoonish();
                }}
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
                                            key={i}
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
