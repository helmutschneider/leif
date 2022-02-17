import * as React from 'react'
import {MoneyInput} from "./money-input";
import {Currency, Workbook, AccountBalance, AccountPlan, Voucher} from "./types";
import {emptyVoucher, findNextUnusedAccountNumber, tryParseInt} from "./util";
import {HttpBackend} from "./http";
import {Autocomplete} from "./autocomplete";
import {VoucherForm} from "./voucher-form";

type Props = {
    accounts: AccountPlan
    currency: Currency
    http: HttpBackend
    onChange: (next: Workbook) => unknown
    workbook: Workbook
}

type State = {
    carries: ReadonlyArray<AccountBalance>
    template: Voucher
    workbook: Workbook
}

export const SettingsPage: React.FC<Props> = props => {
    function emptyTemplate(): Voucher {
        return {
            ...emptyVoucher(),
            is_template: true,
            workbook_id: props.workbook.workbook_id,
        }
    }

    const [state, setState] = React.useState<State>({
        carries: props.workbook.account_carries.slice(),
        template: emptyTemplate(),
        workbook: {
            ...props.workbook,
            templates: [],
            vouchers: [],
            workbook_id: undefined,
        },
    });

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
                                    template: state.template,
                                    workbook: {
                                        ...state.workbook,
                                        name: event.target.value,
                                    },
                                });
                            }}
                            placeholder="Namn"
                            type="text"
                            value={state.workbook.name}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">År</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    carries: state.carries,
                                    template: state.template,
                                    workbook: {
                                        ...state.workbook,
                                        year: tryParseInt(event.target.value, 0),
                                    },
                                });
                            }}
                            placeholder="Namn"
                            type="text"
                            value={state.workbook.year}
                        />
                    </div>
                    <div className="mb-1">
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
                                                    return JSON.stringify(item)
                                                        .toLowerCase()
                                                        .includes(query.toLowerCase());
                                                }}
                                                onChange={event => {
                                                    const next = state.carries.slice()
                                                    next[index] = {
                                                        ...balance,
                                                        account: event.target.value,
                                                    };
                                                    setState({
                                                        carries: next,
                                                        template: state.template,
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
                                                        template: state.template,
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
                                                        template: state.template,
                                                        workbook: state.workbook,
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

                                    const nextAccountNumber = findNextUnusedAccountNumber(
                                        props.accounts, state.workbook.account_carries
                                    );

                                    if (!nextAccountNumber) {
                                        return;
                                    }

                                    setState({
                                        carries: state.carries.concat({
                                            account: nextAccountNumber,
                                            balance: 0,
                                        }),
                                        template: state.template,
                                        workbook: state.workbook,
                                    });
                                }}
                            >
                                Lägg till rad
                            </button>
                        </div>
                    </div>

                    <div className="d-grid">
                        <button
                            className="btn btn-success"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                const next: Workbook = {
                                    ...state.workbook,
                                    account_carries: state.carries,
                                };

                                props.http.send({
                                    method: 'PUT',
                                    url: `/api/workbook/${props.workbook.workbook_id}`,
                                    body: next,
                                }).then(res => {
                                    props.onChange(next);
                                });
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>

                <div className="col-4">
                    <h5>Mallar</h5>
                    <table className="table table-sm">
                        <tbody>
                        {props.workbook.templates.map((template, index) => {
                            return (
                                <tr key={index}>
                                    <td className="col-10">
                                        {template.name}
                                    </td>
                                    <td className="text-end">
                                        <i
                                            className="bi bi-gear-fill me-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                setState({
                                                    ...state,
                                                    template: template,
                                                })
                                            }}
                                            title="Redigera"
                                            role="button"
                                        />
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                if (!confirm('Ta bort mall?')) {
                                                    return;
                                                }

                                                props.http.send({
                                                    method: 'DELETE',
                                                    url: `/api/voucher/${template.voucher_id}`,
                                                }).then(res => {
                                                    const next = props.workbook.templates.slice()
                                                    next.splice(index, 1);
                                                    props.onChange({
                                                        ...props.workbook,
                                                        templates: next,
                                                    });
                                                    setState({
                                                        ...state,
                                                        template: emptyTemplate(),
                                                    });
                                                })
                                            }}
                                            title="Ta bort"
                                            role="button"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="col-4">
                    <div className="row">
                        <div className="col">
                            <h5>
                                {state.template.voucher_id ? 'Redigera mall' : 'Lägg till mall'}
                            </h5>
                        </div>
                        <div className="col-md-auto">
                            {
                                state.template.voucher_id
                                    ? (
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                setState({
                                                    ...state,
                                                    template: emptyTemplate(),
                                                });
                                            }}
                                            role="button"
                                        />
                                    )
                                    : null
                            }
                        </div>
                    </div>

                    <VoucherForm
                        accounts={props.accounts}
                        currency={props.currency}
                        onChange={next => {
                            setState({
                                ...state,
                                template: next,
                            });
                        }}
                        onOK={() => {
                            const isEditingTemplate = typeof state.template.voucher_id !== 'undefined';

                            props.http.send<Voucher>({
                                method: isEditingTemplate ? 'PUT' : 'POST',
                                url: isEditingTemplate
                                    ? `/api/voucher/${state.template.voucher_id}`
                                    : '/api/voucher',
                                body: {
                                    ...state.template,
                                    transactions: state.template.transactions.filter(t => t.amount !== 0),
                                },
                            }).then(res => {
                                const next = props.workbook.templates.slice()

                                if (isEditingTemplate) {
                                    const voucherId = tryParseInt(state.template.voucher_id, undefined);
                                    const index = props.workbook.templates.findIndex(t => {
                                        return typeof voucherId !== 'undefined'
                                            && voucherId === tryParseInt(t.voucher_id, undefined);
                                    });
                                    if (index !== -1) {
                                        next[index] = res;
                                    }
                                } else {
                                    next.push(res);
                                }
                                setState({
                                    ...state,
                                    template: emptyTemplate(),
                                });
                                props.onChange({
                                    ...props.workbook,
                                    templates: next,
                                });
                            })
                        }}
                        voucher={state.template}
                    />
                </div>
            </div>
        </div>

    )
};
