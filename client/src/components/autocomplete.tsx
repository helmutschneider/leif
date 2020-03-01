import * as React from 'react'
import {objectContains} from "720-ts/src/objectContains";
import {classNames} from "720-ts/src/classNames";

type Props<T> = {
    onSelectItem: (item: T) => string
    initialValue?: string
    items: ReadonlyArray<T>
    maxResults?: number
    placeholder?: string
    renderItem: (item: T) => React.ReactNode
}

type State = {
    resultsVisible: boolean
    selectedIndex: number
    value: string
}

enum KeyCode {
    Enter = 13,
    Escape = 27,
    Up = 38,
    Down = 40,
}

// the modulus operator in javascript returns negative
// results when used on negative numbers. we really need
// a positive value for this round-robin thingy.
function modulus(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
}

export function Autocomplete<T extends object>(props: Props<T>) {
    const [state, setState] = React.useState<State>({
        resultsVisible: false,
        selectedIndex: 0,
        value: props.initialValue ?? '',
    })
    const result: Array<T> = []
    const maxResults = props.maxResults ?? 5

    for (let i = 0; i < props.items.length && result.length < maxResults; ++i) {
        const item = props.items[i]
        if (state.value === '' || objectContains(item, state.value)) {
            result.push(item)
        }
    }

    return (
        <div style={{position: 'relative'}}>
            <input
                className="form-control form-control-sm"
                onBlur={() => {
                    setState({
                        ...state,
                        resultsVisible: false,
                    })
                }}
                onChange={event => {
                    setState({
                        ...state,
                        resultsVisible: true,
                        selectedIndex: 0,
                        value: event.target.value,
                    })
                }}
                onFocus={() => {
                    setState({
                        ...state,
                        resultsVisible: true,
                        selectedIndex: 0,
                    })
                }}
                onKeyDown={event => {
                    const st = {
                        ...state,
                    }

                    switch (event.keyCode) {
                        case KeyCode.Enter:
                            const item = result[state.selectedIndex]
                            st.resultsVisible = false
                            st.value = props.onSelectItem(item)
                            break
                        case KeyCode.Escape:
                            break
                        case KeyCode.Up:
                            st.selectedIndex -= 1
                            break
                        case KeyCode.Down:
                            st.selectedIndex += 1
                            break
                    }

                    st.selectedIndex = modulus(
                        st.selectedIndex,
                        result.length
                    )

                    setState(st)
                }}
                placeholder={props.placeholder}
                type="text"
                value={state.value}
            />
            {
                state.resultsVisible
                    ? (
                        <div className="list-group" style={{position: 'absolute', zIndex: 10, width: '100%'}}>
                            {result.map((item, idx) => {
                                const clazz = classNames({
                                    'active': idx === state.selectedIndex,
                                    'list-group-item': true,
                                })
                                return (
                                    <li key={idx}
                                        className={clazz}>
                                        <small>{props.renderItem(item)}</small>
                                    </li>
                                )
                            })}
                        </div>
                    )
                    : undefined
            }
        </div>
    )
}
