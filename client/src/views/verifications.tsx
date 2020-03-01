import * as React from 'react'
import {RouteComponentLike, Verification} from "@app/types";
import {VerificationForm} from "@app/components/verification-form";
import {List, ListColumn} from "@app/components/list";
import {HttpClient} from "@app/http";

const columns: ReadonlyArray<ListColumn<Verification>> = [
    {
        property: 'verification_id',
        size: 2,
        title: 'ID',
    },
    {
        property: 'date',
        size: 4,
        title: 'Date',
    },
    {
        property: 'description',
        size: 6,
        title: 'Description',
    },
]

function loadVerifications(http: HttpClient, accountingPeriodId: number) {
    return http.send<ReadonlyArray<Verification>>({
        method: 'GET',
        url: `/app/accounting-period/${accountingPeriodId}/verification`,
    })
}

export const Verifications: RouteComponentLike = props => {
    const [state, setState] = React.useState({
        currentAccountingPeriod: props.context.accountingPeriods[0]?.accounting_period_id,
        verifications: [] as ReadonlyArray<Verification>,
    })

    React.useEffect(() => {
        if (!state.currentAccountingPeriod) {
            return
        }

        loadVerifications(props.context.http, state.currentAccountingPeriod).then(res => {
            setState({
                ...state,
                verifications: res.body,
            })
        })
    }, [state.currentAccountingPeriod])

    return (
        <div>
            <div className="row">
                <div className="col-8">
                    <h3>Verifications</h3>
                    <List
                        columns={columns}
                        items={state.verifications}
                    />
                </div>
                <div className="col-4">
                    <h3>Create verification</h3>
                    <VerificationForm
                        accounts={props.context.accounts}
                        save={verification => {
                            return props.context.http.send<Verification>({
                                method: 'POST',
                                url: `/app/accounting-period/${state.currentAccountingPeriod}/verification`,
                                body: verification,
                            }).then(res => {
                                const next = state.verifications.slice()
                                next.unshift(res.body)

                                setState({
                                    ...state,
                                    verifications: next,
                                })
                            })
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
