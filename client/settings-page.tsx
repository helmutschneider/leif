import * as React from 'react'
import {MoneyInput} from "./money-input";
import {Currency, Workbook, AccountBalance, AccountPlan} from "./types";
import {findNextUnusedAccountNumber, tryParseInt} from "./util";
import {HttpBackend} from "./http";
import {Autocomplete} from "./autocomplete";

type Props = {
    accounts: AccountPlan
    currency: Currency
    http: HttpBackend
    onChange: (next: Workbook) => unknown
    workbook: Workbook
}

type State = {
    carries: ReadonlyArray<AccountBalance>
    workbook: Workbook
}

export const SettingsPage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        carries: props.workbook.account_carries.slice(),
        workbook: {
            ...props.workbook,
        },
    })

    const workbook = state.workbook;

    return (
        <div>
            <div className="row">
                <div className="col-4">
                    <h5>Arbetsbok</h5>
                    <div className="mb-3">
                        <label className="form-label">Namn</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    carries: state.carries,
                                    workbook: {
                                        ...workbook,
                                        name: event.target.value,
                                    },
                                });
                            }}
                            placeholder="Namn"
                            type="text"
                            value={workbook.name}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">År</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    carries: state.carries,
                                    workbook: {
                                        ...workbook,
                                        year: tryParseInt(event.target.value, 0),
                                    },
                                });
                            }}
                            placeholder="Namn"
                            type="text"
                            value={workbook.year}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Ingående kontobalans</label>

                        <table className="table table-sm align-middle">
                            <tbody>
                            {state.carries.map((balance, index) => {
                                return (
                                    <tr key={index}>
                                        <td className="col-6">
                                            <Autocomplete
                                                data={Object.entries(props.accounts)}
                                                itemMatches={(item, query) => {
                                                    return JSON.stringify(item).includes(query);
                                                }}
                                                onChange={event => {
                                                    const next = state.carries.slice()
                                                    next[index] = {
                                                        ...balance,
                                                        account: event.target.value,
                                                    };
                                                    setState({
                                                        carries: next,
                                                        workbook: state.workbook,
                                                    });
                                                }}
                                                onItemSelected={item => {
                                                    const next = state.carries.slice();
                                                    next[index] = {
                                                        ...balance,
                                                        account: item[0],
                                                    };
                                                    setState({
                                                        carries: next,
                                                        workbook: state.workbook,
                                                    });
                                                }}
                                                renderItem={item => {
                                                    return `${item[0]}: ${item[1]}`;
                                                }}
                                                value={String(balance.account)}
                                            />
                                        </td>
                                        <td>
                                            <MoneyInput
                                                currency={props.currency}
                                                onChange={value => {
                                                    const next = state.carries.slice()
                                                    next[index] = {
                                                        account: balance.account,
                                                        balance: value,
                                                    };

                                                    setState({
                                                        ...state,
                                                        carries: next,
                                                    });
                                                }}
                                                value={balance.balance}
                                            />
                                        </td>
                                        <td>
                                            <i
                                                className="bi bi-x-circle-fill"
                                                onClick={event => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    const next = state.carries.slice()
                                                    next.splice(index, 1);

                                                    setState({
                                                        carries: next,
                                                        workbook: workbook,
                                                    });
                                                }}
                                                role="button"
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                        <div className="d-grid">
                            <button
                                className="btn btn-secondary"
                                onClick={event => {
                                    event.preventDefault()
                                    event.stopPropagation()

                                    const nextAccountNumber = findNextUnusedAccountNumber(props.accounts, workbook.account_carries);

                                    if (!nextAccountNumber) {
                                        return;
                                    }

                                    setState({
                                        carries: state.carries.concat({
                                            account: nextAccountNumber,
                                            balance: 0,
                                        }),
                                        workbook: workbook,
                                    });
                                }}
                            >
                                Lägg till rad
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <button
                className="btn btn-success"
                onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const next: Workbook = {
                        ...workbook,
                        account_carries: state.carries,
                    };

                    props.http.send({
                        method: 'PUT',
                        url: `/api/workbook/${workbook.workbook_id}`,
                        body: next,
                    }).then(res => {
                        props.onChange(next);
                    });
                }}
            >
                Spara
            </button>
        </div>

    )
};
