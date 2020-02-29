import * as React from 'react'
import {RouteComponentLike} from "@app/types";

export const AccountingPeriods: RouteComponentLike = props => {
    return (
        <table className="table table-sm">
            <thead>
            <tr>
                <th>ID</th>
                <th>Start</th>
                <th>End</th>
            </tr>
            </thead>
            <tbody>
            {props.context.accountingPeriods.map((period, idx) => {
                return (
                    <tr key={idx}>
                        <td>{period.accounting_period_id}</td>
                        <td>{period.start}</td>
                        <td>{period.end}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}
