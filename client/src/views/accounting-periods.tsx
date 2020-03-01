import * as React from 'react'
import {AccountingPeriod, RouteComponentLike} from "@app/types";
import {List, ListColumn} from "@app/components/list";

const columns: ReadonlyArray<ListColumn<AccountingPeriod>> = [
    {
        property: 'accounting_period_id',
        size: 2,
        title: 'ID',
    },
    {
        property: 'start',
        size: 5,
        title: 'Start',
    },
    {
        property: 'end',
        size: 5,
        title: 'End',
    },
]

export const AccountingPeriods: RouteComponentLike = props => {
    return (
        <div>
            <h3>Accounting periods</h3>
            <List
                columns={columns}
                items={props.context.accountingPeriods}
            />
        </div>
    )
}
