import * as React from 'react'
import {Workbook, Voucher, currencies, User} from "./types";
import {emptyVoucher, tryParseInt} from "./util";
import {HttpBackend} from "./http";
import {VoucherForm} from "./voucher-form";

type Props = {
    http: HttpBackend
    onChange: (next: Workbook) => unknown
    workbook: Workbook
    user: User
}

type State = {
    carryAccounts: string
    template: Voucher
    username: string
}

export const SettingsPage: React.FC<Props> = props => {
    function emptyTemplate(): Voucher {
        return {
            ...emptyVoucher(),
            is_template: true,
        }
    }

    const [state, setState] = React.useState<State>({
        carryAccounts: props.workbook.carry_accounts,
        template: emptyTemplate(),
        username: props.user.username,
    });

    return (
        <div>
            <div className="row">
                <div className="col-4">
                    <h5>Generellt</h5>

                    <div className="mb-3">
                        <label className="form-label">Användarnamn</label>
                        <input
                            className="form-control"
                            disabled={true}
                            onChange={event => {
                                setState({
                                    ...state,
                                    username: event.target.value,
                                });
                            }}
                            type="text"
                            value={state.username}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Nolla ej konton</label>
                        <textarea
                            className="form-control"
                            onChange={event => {
                                setState({
                                    ...state,
                                    carryAccounts: event.target.value,
                                });
                            }}
                            rows={4}
                            value={state.carryAccounts}
                        />
                    </div>

                    <div className="d-grid">
                        <button
                            className="btn btn-success"
                            onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()

                                props.http.send({
                                    method: 'PUT',
                                    url: `/api/user/${props.user.user_id}`,
                                    body: {
                                        username: state.username,
                                        carry_accounts: state.carryAccounts,
                                    },
                                }).then(res => {
                                    props.onChange({
                                        ...props.workbook,
                                        carry_accounts: state.carryAccounts,
                                    });
                                })
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
                        accounts={props.workbook.accounts}
                        currency={currencies[props.workbook.currency]}
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
