import * as React from 'react'
import * as t from "./types";
import {emptyVoucher, formatDate} from "./util";
import {HttpSendFn} from "./http";
import {VoucherForm} from "./voucher-form";
import {Modal} from "./modal";

type Props = {
    http: HttpSendFn
    onWorkbookChanged: () => unknown
    workbook: t.Workbook
    user: t.User
}

type Editing =
    | { kind: 'none' }
    | { kind: 'voucher', voucher: t.Voucher }

type State = {
    confirmPassword: string
    editing: Editing
    password: string
    username: string
    organization: t.Organization
}

export const SettingsPage: React.FC<Props> = props => {
    function emptyTemplate(): t.Voucher {
        return {
            ...emptyVoucher(),
            is_template: true,
        }
    }

    const [state, setState] = React.useState<State>({
        confirmPassword: '',
        editing: { kind: 'none' },
        password: '',
        username: props.user.username,
        organization: {
            ...props.workbook.organization,
        },
    });

    function closeModal() {
        setState({
            ...state,
            editing: { kind: 'none' },
        });
    }

    return (
        <div>
            <div className="row">
                <div className="col-6">
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

                <div className="col-6">
                    <div className="d-flex">
                        <h5 className="flex-grow-1">Mallar</h5>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                setState({
                                    ...state,
                                    editing: { kind: 'voucher', voucher: emptyTemplate() },
                                });
                            }}>
                            Skapa mall
                        </button>
                    </div>

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
                                                    editing: {
                                                        kind: 'voucher',
                                                        voucher: template,
                                                    },
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
                                                const copied: t.Voucher = {
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
                                                        editing: { kind: 'none' },
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
            </div>
            
            <Modal
                close={closeModal}
                show={state.editing.kind === 'voucher'}
                title={state.editing.kind === 'voucher' && typeof state.editing.voucher.voucher_id !== 'undefined'
                    ? (state.editing.voucher.name || 'Redigera mall')
                    : 'Skapa mall'}
            >
                {state.editing.kind === 'voucher' ? (
                    <VoucherForm
                        accounts={props.workbook.accounts}
                        currency={t.currencies[props.workbook.currency]}
                        onChange={next => {
                            setState({
                                ...state,
                                editing: { kind: 'voucher', voucher: next },
                            });
                        }}
                        onOK={() => {
                            if (state.editing.kind !== 'voucher') {
                                return;
                            }

                            const voucher = state.editing.voucher;
                            const isEditingTemplate = typeof voucher.voucher_id !== 'undefined';

                            props.http<t.Voucher>({
                                method: isEditingTemplate ? 'PUT' : 'POST',
                                url: isEditingTemplate
                                    ? `/api/voucher/${voucher.voucher_id}`
                                    : '/api/voucher',
                                body: {
                                    ...voucher,
                                    transactions: voucher.transactions.filter(t => t.amount !== 0),
                                },
                            }).then(res => {
                                setState({
                                    ...state,
                                    editing: { kind: 'none' },
                                });
                                props.onWorkbookChanged();
                            })
                        }}
                        voucher={state.editing.voucher}
                    />
                ) : undefined}
            </Modal>
        </div>

    )
};
