import * as React from 'react'
import {AccountPlan, Attachment, Currency, Voucher} from './types'
import {
    areDebitsAndCreditsBalanced,
    arrayBufferToBase64,
    ensureHasEmptyTransaction,
    formatDate, objectContains,
    toArray,
} from './util'
import {MoneyInput} from "./money-input";
import {Autocomplete} from "./autocomplete";

type Props = {
    accounts: AccountPlan
    currency: Currency
    onChange: (next: Voucher) => unknown
    onOK: () => unknown
    templates?: ReadonlyArray<Voucher>
    voucher: Voucher
}

export const VoucherForm: React.FC<Props> = props => {
    const isBalanced = areDebitsAndCreditsBalanced(props.voucher);

    return (
        <React.Fragment>
            <div className="mb-3">
                <label className="form-label">Namn</label>
                {
                    props.voucher.is_template
                        ? (
                            <input
                                className="form-control"
                                onChange={event => {
                                    props.onChange({
                                        ...props.voucher,
                                        name: event.target.value,
                                    })
                                }}
                                placeholder="Namn"
                                type="text"
                                value={props.voucher.name}
                            />
                        )
                        : (
                            <Autocomplete
                                data={props.templates ?? []}
                                itemMatches={(template, query) => {
                                    return template.name
                                        .toLowerCase()
                                        .includes(query.toLowerCase());
                                }}
                                onChange={event => {
                                    props.onChange({
                                        ...props.voucher,
                                        name: event.target.value,
                                    });
                                }}
                                onItemSelected={template => {
                                    props.onChange({
                                        ...template,
                                        date: formatDate(new Date(), 'yyyy-MM-dd'),
                                        is_template: false,
                                        voucher_id: undefined,
                                    });
                                }}
                                placeholder="Namn"
                                renderItem={template => template.name}
                                value={props.voucher.name}
                            />
                        )
                }
            </div>

            <div className="mb-3">
                <label className="form-label">Datum</label>
                <input
                    className="form-control"
                    disabled={props.voucher.is_template}
                    onChange={event => {
                        if (!event.target.valueAsDate) {
                            return
                        }
                        props.onChange({
                            ...props.voucher,
                            date: formatDate(event.target.valueAsDate, 'yyyy-MM-dd'),
                        })
                    }}
                    placeholder="Datum"
                    type="date"
                    value={props.voucher.date}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Anteckningar</label>
                <textarea
                    className="form-control"
                    onChange={event => {
                        props.onChange({
                            ...props.voucher,
                            notes: event.target.value,
                        })
                    }}
                    placeholder="Anteckningar"
                    rows={4}
                    value={props.voucher.notes}
                />
            </div>

            <div className="mb-3">
                <table className="table table-sm align-middle">
                    <thead>
                        <tr>
                            <th className="col-4">Konto</th>
                            <th>Debit</th>
                            <th>Kredit</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {props.voucher.transactions.map((t, idx) => {
                            return (
                                <tr key={idx}>
                                    <td>
                                        <Autocomplete
                                            data={Object.entries(props.accounts)}
                                            itemMatches={objectContains}
                                            onChange={event => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    account: event.target.value as any,
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                });
                                            }}
                                            onItemSelected={item => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    account: item[0] as any,
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                });
                                            }}
                                            renderItem={item => {
                                                return `${item[0]}: ${item[1]}`;
                                            }}
                                            value={String(t.account)}
                                        />
                                    </td>
                                    <td>
                                        <MoneyInput
                                            currency={props.currency}
                                            disabled={t.kind === 'credit' && t.amount !== 0}
                                            onChange={amount => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    amount: amount,
                                                    kind: 'debit',
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            placeholder="Debit"
                                            value={t.kind === 'credit' && t.amount !== 0 ? '-' : t.amount}
                                        />
                                    </td>
                                    <td>
                                        <MoneyInput
                                            currency={props.currency}
                                            disabled={t.kind === 'debit' && t.amount !== 0}
                                            onChange={amount => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    amount: amount,
                                                    kind: 'credit',
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            placeholder="Kredit"
                                            value={t.kind === 'debit' && t.amount !== 0 ? '-' : t.amount}
                                        />
                                    </td>
                                    <td>
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                const transactions = props.voucher.transactions.slice()
                                                transactions.splice(idx, 1);
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            role="button"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="row mb-1">
                    <div className="col">
                        <div className="d-grid">
                            <label
                                htmlFor="files"
                                className="btn btn-secondary">
                                Bifoga filer
                            </label>
                            <input
                                id="files"
                                disabled={props.voucher.is_template}
                                onChange={event => {
                                    if (!event.target.files) {
                                        return
                                    }
                                    const files = toArray(event.target.files)
                                    const promises = files.map(file => {
                                        return file.arrayBuffer()
                                    })

                                    Promise.all(promises).then(buffers => {
                                        return buffers.map((buffer, idx) => {
                                            const file = files[idx]!;
                                            const attachment: Attachment = {
                                                data: arrayBufferToBase64(buffer),
                                                mime: file.type,
                                                name: file.name,
                                                size: file.size,
                                            }
                                            return attachment
                                        })
                                    }).then(stuff => {
                                        props.onChange({
                                            ...props.voucher,
                                            attachments: props.voucher.attachments.concat(stuff),
                                        })
                                    })
                                }}
                                multiple={true}
                                style={{ display: 'none' }}
                                type="file"
                            />
                        </div>
                    </div>
                    {props.voucher.attachments.map((attachment, idx) => {
                        return (
                            <div
                                className="col"
                                key={idx}>
                                <div className="d-grid">
                                    <button
                                        className="btn btn-secondary"
                                        style={{ cursor: 'auto' }}
                                        role="none"
                                    >
                                        {attachment.name}
                                        <i
                                            className="bi bi-x-circle-fill ms-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                const next = props.voucher.attachments.slice()
                                                next.splice(idx, 1)
                                                props.onChange({
                                                    ...props.voucher,
                                                    attachments: next,
                                                })
                                            }}
                                            role="button"
                                        />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="d-grid">
                    <button
                        className="btn btn-success"
                        disabled={props.voucher.name === '' || !isBalanced}
                        onClick={event => {
                            event.preventDefault()
                            event.stopPropagation()

                            props.onOK()
                        }}
                        title={isBalanced ? '' : 'Obalans'}
                    >
                        OK
                    </button>
                </div>
            </div>
        </React.Fragment>
    )
}
