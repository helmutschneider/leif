import * as React from 'react'
import {MoneyInput} from "./money-input";
import {Currency, Workbook, accounts, AccountBalanceMap} from "./types";
import {findNextUnusedAccountNumber, tryParseInt} from "./util";
import {HttpBackend} from "./http";
import {Autocomplete} from "./autocomplete";

type Props = {
    currency: Currency
    http: HttpBackend
    onChange: (next: Workbook) => unknown
    workbook: Workbook
}

type AccountBalance = {
    account: number
    balance: number
}

type State = {
    balances: ReadonlyArray<AccountBalance>
    workbook: Workbook
}

export const SettingsPage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        balances: Object.entries(props.workbook.balance_carry).map(item => {
            return {
                account: tryParseInt(item[0], 0),
                balance: tryParseInt(item[1], 0),
            };
        }),
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
                                    balances: state.balances,
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
                                    balances: state.balances,
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
                            {state.balances.map((balance, index) => {
                                return (
                                    <tr key={index}>
                                        <td className="col-6">
                                            <Autocomplete
                                                data={accounts}
                                                itemMatches={(item, query) => {
                                                    return JSON.stringify(item).includes(query);
                                                }}
                                                onChange={event => {
                                                    const next = state.balances.slice()
                                                    next[index] = {
                                                        ...balance,
                                                        account: tryParseInt(event.target.value, 0),
                                                    };
                                                    setState({
                                                        balances: next,
                                                        workbook: state.workbook,
                                                    });
                                                }}
                                                onItemSelected={item => {
                                                    const next = state.balances.slice();
                                                    next[index] = {
                                                        ...balance,
                                                        account: item.number,
                                                    };
                                                    setState({
                                                        balances: next,
                                                        workbook: state.workbook,
                                                    });
                                                }}
                                                renderItem={item => {
                                                    return `${item.number}: ${item.name}`;
                                                }}
                                                value={String(balance.account)}
                                            />
                                        </td>
                                        <td>
                                            <MoneyInput
                                                currency={props.currency}
                                                onChange={value => {
                                                    const next = state.balances.slice()
                                                    next[index] = {
                                                        account: balance.account,
                                                        balance: value,
                                                    };

                                                    setState({
                                                        ...state,
                                                        balances: next,
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
                                                    const next = state.balances.slice()
                                                    next.splice(index, 1);

                                                    setState({
                                                        balances: next,
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

                                    const nextAccountNumber = findNextUnusedAccountNumber(workbook.balance_carry);

                                    if (!nextAccountNumber) {
                                        return;
                                    }

                                    setState({
                                        balances: state.balances.concat({
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
                        balance_carry: state.balances.reduce((carry, item) => {
                            carry[item.account] = item.balance;
                            return carry;
                        }, {} as AccountBalanceMap),
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
