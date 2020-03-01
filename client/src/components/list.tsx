import * as React from 'react'
import {objectContains} from "720-ts/src/objectContains";

type ColumnRenderer<T> = {
    (model: T, property: (keyof T) | undefined): React.ReactNode
}
export type ListColumn<T> = {
    property?: keyof T
    render?: ColumnRenderer<T>
    size?: number
    title: string
}

type ListProps<T> = {
    columns: ReadonlyArray<ListColumn<T>>
    items: ReadonlyArray<T>
}

type ListRowProps<T> = {
    columns: ReadonlyArray<ListColumn<T>>
    item: T
}

function defaultColumnRenderer<T>(model: T, property: (keyof T) | undefined) {
    if (typeof property !== 'undefined') {
        return model[property]
    }
    return ''
}

function ListRow<T>(props: ListRowProps<T>) {
    return (
        <tr>
            {props.columns.map((c, idx) => {
                return (
                    <td key={idx}>
                        {(c.render ?? defaultColumnRenderer)(props.item, c.property)}
                    </td>
                )
            })}
        </tr>
    )
}

export function List<T extends object>(props: ListProps<T>) {
    const [state, setState] = React.useState({
        query: '',
    })

    const items = props.items.filter(item => {
        return state.query === '' || objectContains(item, state.query)
    })

    function getSizeClassName(column: ListColumn<T>): string {
        if (typeof column.size === 'undefined') {
            return ''
        }
        return `col-${column.size}`
    }

    return (
        <React.Fragment>
            <div className="form-group">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={state.query}
                    onChange={event => {
                        setState({ query: event.target.value })
                    }}
                    placeholder="Search"
                />
            </div>
            <table className="table table-sm">
                <thead>
                <tr>
                    {props.columns.map((c, idx) => {
                        return (
                            <th key={idx}
                                className={getSizeClassName(c)}>
                                {c.title}
                            </th>
                        )
                    })}
                </tr>
                </thead>
                <tbody>
                {items.map((item, idx) => {
                    return (
                        <ListRow
                            key={idx}
                            columns={props.columns}
                            item={item}
                        />
                    )
                })}
                </tbody>
            </table>
        </React.Fragment>
    )
}
