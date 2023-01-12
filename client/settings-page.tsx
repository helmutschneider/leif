import * as React from 'react'
import {Workbook, Voucher, currencies, User, Organization} from "./types";
import {emptyVoucher, formatDate} from "./util";
import {HttpSendFn} from "./http";
import {VoucherForm} from "./voucher-form";

type Props = {
    http: HttpSendFn
    onWorkbookChanged: () => unknown
    workbook: Workbook
    user: User
}

type State = {
    confirmPassword: string
    template: Voucher
    password: string
    username: string
    organization: Organization
}

export const SettingsPage: React.FC<Props> = props => {
    function emptyTemplate(): Voucher {
        return {
            ...emptyVoucher(),
            is_template: true,
        }
    }

    const [state, setState] = React.useState<State>({
        confirmPassword: '',
        template: emptyTemplate(),
        password: '',
        username: props.user.username,
        organization: {
            ...props.user.organization,
        },
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
                        <label className="form-label">Lösenord</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    ...state,
                                    password: event.target.value,
                                });
                            }}
                            type="password"
                            value={state.password}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Bekräfta lösenord</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    ...state,
                                    confirmPassword: event.target.value,
                                });
                            }}
                            type="password"
                            value={state.confirmPassword}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Organisationens namn</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                setState({
                                    ...state,
                                    organization: {
                                        ...state.organization,
                                        name: event.target.value,
                                    },
                                });
                            }}
                            value={state.organization.name}
                            type="text"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Nolla ej konton</label>
                        <textarea
                            className="form-control"
                            onChange={event => {
                                setState({
                                    ...state,
                                    organization: {
                                        ...state.organization,
                                        carry_accounts: event.target.value,
                                    },
                                });
                            }}
                            rows={4}
                            value={state.organization.carry_accounts}
                        />
                    </div>

                    <div className="d-grid">
                        <button
                            className="btn btn-success"
                            disabled={!!state.password && state.password !== state.confirmPassword}
                            onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()

                                props.http({
                                    method: 'PUT',
                                    url: `/api/user/${props.user.user_id}`,
                                    body: {
                                        username: state.username,
                                        password: state.password,
                                        organization: state.organization,
                                    },
                                }).then(res => {
                                    props.onWorkbookChanged();
                                    setState({
                                        ...state,
                                        confirmPassword: '',
                                        password: '',
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
                                                    template: state.template.voucher_id === template.voucher_id
                                                        ? emptyTemplate()
                                                        : template,
                                                });
                                            }}
                                            title="Redigera"
                                            role="button"
                                        />
                                        <i
                                            className="bi bi-layers-fill me-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                const dt = new Date();
                                                const copied: Voucher = {
                                                    attachments: [],
                                                    created_at: '',
                                                    date: formatDate(dt, 'yyyy-MM-dd'),
                                                    is_template: true,
                                                    name: `${template.name} (kopia ${formatDate(dt, 'yyyy-MM-dd HH:mm:ss')})`,
                                                    notes: template.notes,
                                                    transactions: template.transactions,
                                                    updated_at: '',
                                                };

                                                props.http({
                                                    method: 'POST',
                                                    url: '/api/voucher',
                                                    body: copied,
                                                }).then(res => {
                                                    props.onWorkbookChanged();
                                                });
                                            }}
                                            title="Kopiera"
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

                                                props.http({
                                                    method: 'DELETE',
                                                    url: `/api/voucher/${template.voucher_id}`,
                                                }).then(res => {
                                                    props.onWorkbookChanged();
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
                                title="Avbryt"
                            />
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

                            props.http<Voucher>({
                                method: isEditingTemplate ? 'PUT' : 'POST',
                                url: isEditingTemplate
                                    ? `/api/voucher/${state.template.voucher_id}`
                                    : '/api/voucher',
                                body: {
                                    ...state.template,
                                    transactions: state.template.transactions.filter(t => t.amount !== 0),
                                },
                            }).then(res => {
                                setState({
                                    ...state,
                                    template: emptyTemplate(),
                                });
                                props.onWorkbookChanged();
                            })
                        }}
                        voucher={state.template}
                    />
                </div>
            </div>
        </div>

    )
};
