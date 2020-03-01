import * as React from 'react'
import {RouteComponentLike, Account} from "@app/types";
import {List, ListColumn} from "@app/components/list";

const columns: ReadonlyArray<ListColumn<Account>> = [
    {
        property: 'account_id',
        size: 2,
        title: 'ID',
    },
    {
        property: 'number',
        size: 2,
        title: 'Number',
    },
    {
        property: 'description',
        size: 8,
        title: 'Description',
    },
]

export const Accounts: RouteComponentLike = props => {
    return (
        <React.Fragment>
            <h3>Accounts</h3>
            <List
                columns={columns}
                items={props.context.accounts}
            />
        </React.Fragment>
    )
}
