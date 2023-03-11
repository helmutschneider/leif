import * as React from 'react'
import * as t from "./types";
import {emptyInvoiceDataset, emptyInvoiceTemplate, emptyVoucher, formatDate, tryParseFloat, tryParseInt} from "./util";
import {HttpSendFn} from "./http";
import {VoucherForm} from "./voucher-form";
import {Modal} from "./modal";
import {currencies} from "./types";
import {JsonInput} from "./json-input";

type Props = {
    http: HttpSendFn
    onWorkbookChanged: () => unknown
    workbook: t.Workbook
    user: t.User
}

type Editing =
    | { kind: 'none' }
    | { kind: 'voucher', voucher: t.Voucher }
    | { kind: 'invoice_template', template: t.InvoiceTemplate }
    | { kind: 'invoice_dataset', dataset: t.InvoiceDataset }

type State = {
    confirmPassword: string
    editing: Editing
    password: string
    username: string
    organization: t.Organization
}

type InvoiceTemplateFormProps = {
    onChange: (next: t.InvoiceTemplate) => unknown
    template: t.InvoiceTemplate
}

const InvoiceTemplateForm: React.FC<InvoiceTemplateFormProps> = props => {
    return (
        <React.Fragment>
            <div className="mb-3">
                <label className="form-label">Namn</label>
                <input
                    className="form-control"
                    onChange={event => {
                        props.onChange({
                            ...props.template,
                            name: event.target.value,
                        });
                    }}
                    placeholder="Namn"
                    type="text"
                    value={props.template.name}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Data</label>
                <textarea
                    className="form-control font-monospace"
                    onChange={event => {
                        props.onChange({
                            ...props.template,
                            body: event.target.value,
                        });
                    }}
                    placeholder="HTML..."
                    rows={32}
                    value={props.template.body}
                />
            </div>
        </React.Fragment>
    )
};



type InvoiceDatasetFormProps = {
    onChange: (next: t.InvoiceDataset) => unknown
    datasets: ReadonlyArray<t.InvoiceDataset>
    dataset: t.InvoiceDataset
    templates: ReadonlyArray<t.InvoiceTemplate>
}

const InvoiceDatasetForm: React.FC<InvoiceDatasetFormProps> = props => {
    const canInheritFromDatasets = props.datasets.filter(d => d.invoice_dataset_id !== props.dataset.invoice_dataset_id);

    return (
        <React.Fragment>
            <div className="row">
                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">Namn</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                props.onChange({
                                    ...props.dataset,
                                    name: event.target.value,
                                });
                            }}
                            placeholder="Namn"
                            type="text"
                            value={props.dataset.name}
                        />
                    </div>
                </div>

                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">PDF-mall</label>
                        <select
                            className="form-control"
                            onChange={event => {
                                const parsed = tryParseInt(event.target.value, undefined);

                                props.onChange({
                                    ...props.dataset,
                                    invoice_template_id: parsed,
                                });
                            }}
                            value={props.dataset.invoice_template_id}
                        >
                            <option/>
                            {props.templates.map((template, i) => {
                                return (
                                    <option
                                        key={i}
                                        value={template.invoice_template_id}>
                                        {template.name}
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">Ärver från</label>
                        <select
                            className="form-control"
                            onChange={event => {
                                const parsed = tryParseInt(event.target.value, undefined);

                                props.onChange({
                                    ...props.dataset,
                                    extends_id: parsed,
                                });
                            }}
                            value={props.dataset.extends_id || ''}
                        >
                            <option/>
                            {canInheritFromDatasets.map((set, i) => {
                                return (
                                    <option
                                        key={i}
                                        value={set.invoice_dataset_id}>
                                        {set.name}
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">Valuta</label>
                        <select
                            className="form-control"
                            onChange={event => {
                                props.onChange({
                                    ...props.dataset,
                                    currency_code: event.target.value as any,
                                });
                            }}
                            value={props.dataset.currency_code}
                        >
                            <option/>
                            {Object.keys(currencies).map((key, i) => {
                                return (
                                    <option key={i} value={key}>{key}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">Momssats</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                props.onChange({
                                    ...props.dataset,
                                    vat_rate: tryParseFloat(event.target.value, 0),
                                });
                            }}
                            placeholder="Precision"
                            type="text"
                            value={props.dataset.vat_rate}
                        />
                    </div>
                </div>

                <div className="col-6">
                    <div className="mb-3">
                        <label className="form-label">Precision</label>
                        <input
                            className="form-control"
                            onChange={event => {
                                props.onChange({
                                    ...props.dataset,
                                    precision: tryParseInt(event.target.value, 0),
                                });
                            }}
                            placeholder="Precision"
                            type="text"
                            value={props.dataset.precision}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">Fält</label>
                <JsonInput
                    onChange={next => {
                        props.onChange({
                            ...props.dataset,
                            fields: next,
                        });
                    }}
                    rows={24}
                    value={props.dataset.fields}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Rader</label>
                <JsonInput
                    onChange={next => {
                        props.onChange({
                            ...props.dataset,
                            line_items: next,
                        });
                    }}
                    rows={24}
                    value={props.dataset.line_items}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Variabler</label>
                <JsonInput
                    onChange={next => {
                        props.onChange({
                            ...props.dataset,
                            variables: next,
                        });
                    }}
                    rows={24}
                    value={props.dataset.variables}
                />
            </div>
        </React.Fragment>
    )
};

function ensureHasEmptyFieldAndLineItem(set: t.InvoiceDataset): t.InvoiceDataset {
    const next: t.InvoiceDataset = {
        ...set,
    };

    {
        const len = next.fields.length;
        if (!len || next.fields[len - 1]?.name) {
            next.fields = next.fields.concat({
                name: '',
                key: '',
                value: '',
                is_editable: true,
            });
        }
    }

    {
        const len = next.line_items.length;
        if (!len || next.line_items[len - 1]?.name) {
            next.line_items = next.line_items.concat({
                name: '',
                key: '',
                price: 0,
                quantity: 0,
            });
        }
    }

    return next;
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
        editing: {kind: 'none'},
        password: '',
        username: props.user.username,
        organization: {
            ...props.workbook.organization,
        },
    });

    function closeModal() {
        setState({
            ...state,
            editing: {kind: 'none'},
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
                    <div className="d-flex mb-1">
                        <h5 className="flex-grow-1">Verifikat: mallar</h5>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                setState({
                                    ...state,
                                    editing: {kind: 'voucher', voucher: emptyTemplate()},
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

            <div className="row">
                <div className="col-6">
                    <div className="d-flex mb-1">
                        <h5 className="flex-grow-1">Faktura: PDF-mallar</h5>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                setState({
                                    ...state,
                                    editing: {kind: 'invoice_template', template: emptyInvoiceTemplate()},
                                });
                            }}>
                            Skapa mall
                        </button>
                    </div>

                    <table className="table table-sm">
                        <tbody>
                        {props.workbook.invoice_templates.map((template, i) => {
                            return (
                                <tr key={i}>
                                    <td className="col-10">{template.name}</td>
                                    <td className="text-end">
                                        <i
                                            className="bi bi-gear-fill me-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                setState({
                                                    ...state,
                                                    editing: {
                                                        kind: 'invoice_template',
                                                        template: template,
                                                    },
                                                });
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

                                                props.http({
                                                    method: 'DELETE',
                                                    url: `/api/invoice-template/${template.invoice_template_id}`,
                                                }).then(res => {
                                                    props.onWorkbookChanged();
                                                })
                                            }}
                                            title="Ta bort"
                                            role="button"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="col-6">
                    <div className="d-flex mb-1">
                        <h5 className="flex-grow-1">Faktura: dataset</h5>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                setState({
                                    ...state,
                                    editing: {kind: 'invoice_dataset', dataset: emptyInvoiceDataset()},
                                });
                            }}>
                            Skapa dataset
                        </button>
                    </div>

                    <table className="table table-sm">
                        <tbody>
                        {props.workbook.invoice_datasets.map((dataset, i) => {
                            return (
                                <tr key={i}>
                                    <td className="col-10">{dataset.name}</td>
                                    <td className="text-end">
                                        <i
                                            className="bi bi-gear-fill me-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                setState({
                                                    ...state,
                                                    editing: {
                                                        kind: 'invoice_dataset',
                                                        dataset: dataset,
                                                    },
                                                });
                                            }}
                                            title="Redigera"
                                            role="button"
                                        />
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                if (!confirm('Ta bort dataset?')) {
                                                    return;
                                                }

                                                props.http({
                                                    method: 'DELETE',
                                                    url: `/api/invoice-dataset/${dataset.invoice_dataset_id}`,
                                                }).then(res => {
                                                    props.onWorkbookChanged();
                                                })
                                            }}
                                            title="Ta bort"
                                            role="button"
                                        />
                                    </td>
                                </tr>
                            );
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
                                editing: {kind: 'voucher', voucher: next},
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
                                    editing: {kind: 'none'},
                                });
                                props.onWorkbookChanged();
                            });
                        }}
                        voucher={state.editing.voucher}
                    />
                ) : undefined}
            </Modal>

            <Modal
                actions={
                    <React.Fragment>
                        <button
                            className="btn btn-success"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                if (state.editing.kind !== 'invoice_template') {
                                    return;
                                }

                                const template = state.editing.template;
                                const isEditingTemplate = typeof template.invoice_template_id !== 'undefined';

                                props.http<t.Voucher>({
                                    method: isEditingTemplate ? 'PUT' : 'POST',
                                    url: isEditingTemplate
                                        ? `/api/invoice-template/${template.invoice_template_id}`
                                        : '/api/invoice-template',
                                    body: template,
                                }).then(res => {
                                    setState({
                                        ...state,
                                        editing: {kind: 'none'},
                                    });
                                    props.onWorkbookChanged();
                                });
                            }}
                        >
                            Spara
                        </button>
                    </React.Fragment>
                }
                close={closeModal}
                show={state.editing.kind === 'invoice_template'}
                size="xl"
                title={state.editing.kind === 'invoice_template' && typeof state.editing.template.invoice_template_id !== 'undefined'
                    ? (state.editing.template.name || 'Redigera fakturamall')
                    : 'Skapa fakturamall'}
            >
                {state.editing.kind === 'invoice_template'
                    ? <InvoiceTemplateForm
                        onChange={next => {
                            setState({
                                ...state,
                                editing: {
                                    kind: 'invoice_template',
                                    template: next,
                                },
                            })
                        }}
                        template={state.editing.template}
                    />
                    : undefined}
            </Modal>

            <Modal
                actions={
                    <React.Fragment>
                        <button
                            className="btn btn-success"
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();

                                if (state.editing.kind !== 'invoice_dataset') {
                                    return;
                                }

                                const dataset: t.InvoiceDataset = {
                                    ...state.editing.dataset,
                                    fields: state.editing.dataset.fields.filter(f => !!f.key),
                                    line_items: state.editing.dataset.line_items.filter(f => !!f.key),
                                };

                                const isEditingDataset = typeof dataset.invoice_dataset_id !== 'undefined';

                                props.http<t.Voucher>({
                                    method: isEditingDataset ? 'PUT' : 'POST',
                                    url: isEditingDataset
                                        ? `/api/invoice-dataset/${dataset.invoice_dataset_id}`
                                        : '/api/invoice-dataset',
                                    body: dataset,
                                }).then(res => {
                                    setState({
                                        ...state,
                                        editing: {kind: 'none'},
                                    });
                                    props.onWorkbookChanged();
                                });
                            }}
                        >
                            Spara
                        </button>
                    </React.Fragment>
                }
                close={closeModal}
                show={state.editing.kind === 'invoice_dataset'}
                size="xl"
                title={state.editing.kind === 'invoice_dataset' && typeof state.editing.dataset.invoice_dataset_id !== 'undefined'
                    ? (state.editing.dataset.name || 'Redigera dataset')
                    : 'Skapa dataset'}
            >
                {state.editing.kind === 'invoice_dataset'
                    ? <InvoiceDatasetForm
                        onChange={next => {
                            setState({
                                ...state,
                                editing: {
                                    kind: 'invoice_dataset',
                                    dataset: next,
                                },
                            })
                        }}
                        datasets={props.workbook.invoice_datasets}
                        dataset={ensureHasEmptyFieldAndLineItem(state.editing.dataset)}
                        templates={props.workbook.invoice_templates}
                    />
                    : undefined}
            </Modal>
        </div>

    )
};
