import * as React from 'react';
import * as t from './types'
import {HttpSendFn, LeifRequest} from "./http";
import {formatIntegerAsMoneyWithSeparatorsAndSymbol} from "./util";
import {MoneyInput} from "./money-input";
import {currencies} from "./types";

type Props = {
    http: HttpSendFn
    datasets: ReadonlyArray<t.InvoiceDataset>
    user: t.User
}

function emptyItem<K extends keyof t.InvoiceLineItem>(props: Pick<t.InvoiceLineItem, K>): t.InvoiceLineItem {
    return {
        name: '',
        key: '',
        kind: 'wage_hourly',
        price: 0,
        quantity: 0,
        ...props,
    };
}

function getTotal(invoice: t.Invoice, precision: number): number {
    let num: number = 0;

    for (const item of invoice.line_items) {
        num += item.quantity * item.price;
    }

    // FIXME: rounding
    return num;
    // return round(num, precision)
}

function getVat(invoice: t.Invoice, vatRate: number, precision: number): number {
    const total = getTotal(invoice, precision);

    // FIXME: rounding
    return total * (vatRate / 100.0);
    // return round(getTotal(invoice, precision) * (vatRate / 100.0), precision);
}

type FormProps = {
    dataset: t.InvoiceDataset
    invoice: t.Invoice
    onChange: (invoice: t.Invoice) => void
}

function onItemChangeWithValue<K extends keyof t.InvoiceLineItem>(props: FormProps, key: K, index: number): (value: unknown) => void {
    return value => {
        const items = props.invoice.line_items.slice();
        const item: t.InvoiceLineItem = {
            ...items[index]!,
        };
        item[key] = value as any;
        items[index] = item;

        const invoice: t.Invoice = {
            ...props.invoice,
            line_items: items,
        };

        props.onChange(invoice);
    };
}

function onItemChangeWithEvent<K extends keyof t.InvoiceLineItem>(props: FormProps, key: K, index: number): (event: React.ChangeEvent<HTMLInputElement>) => void {
    const fn = onItemChangeWithValue(props, key, index);

    return event => {
        fn(event.target.value);
    };
}

const Form: React.FC<FormProps> = props => {
    const dataset = props.dataset;
    const total = getTotal(props.invoice, props.dataset.precision);
    const vat = getVat(props.invoice, dataset.vat_rate, dataset.precision);
    const totalWithVat = total + vat;
    const currency = currencies[dataset.currency_code];

    return (
        <React.Fragment>
            <div className="row">
                {props.invoice.fields.map((field, idx) => {
                    if (!field.is_visible) {
                        return;
                    }

                    return (
                        <div className="col-6" key={idx}>
                            <div className="mb-3">
                                <label className="form-label">{field.name}</label>
                                <textarea
                                    className="form-control"
                                    placeholder={field.name}
                                    readOnly={field.is_editable == false}
                                    rows={3}
                                    onChange={event => {
                                        const next = dataset.fields.slice();
                                        next[idx] = {
                                            ...field,
                                            value: event.target.value,
                                        }
                                        const invoice: t.Invoice = {
                                            ...props.invoice,
                                            fields: next,
                                        };
                                        props.onChange(invoice);
                                    }}
                                    value={field.value} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="row">
                <div className="col-6">
                    <label>Artikel</label>
                </div>
                <div className="col-3">
                    <label>Timmar</label>
                </div>
                <div className="col-3">
                    <label>Pris/timme</label>
                </div>
            </div>

            {props.invoice.line_items.map((item, idx) => {
                return (
                    <div className="row mb-3" key={idx}>
                        <div className="col-6">
                            <input type="text"
                                   className="form-control"
                                   placeholder="Artikel"
                                   value={item.name}
                                   onChange={onItemChangeWithEvent(props, 'name', idx)} />
                        </div>
                        <div className="col-3">
                            <input type="text"
                                   className="form-control"
                                   placeholder="Timmar"
                                   value={item.quantity}
                                   onChange={onItemChangeWithEvent(props, 'quantity', idx)} />
                        </div>
                        <div className="col-3">
                            <div className="input-group">
                                <MoneyInput
                                    currency={currency}
                                    onChange={onItemChangeWithValue(props, 'price', idx)}
                                    value={item.price}
                                />
                            </div>
                        </div>
                    </div>
                )
            })}

            <table className="table">
                <tbody>
                <tr>
                    <td className="col-6">Summa artiklar</td>
                    <td className="col-6 text-end">
                        {formatIntegerAsMoneyWithSeparatorsAndSymbol(total, currency)}
                    </td>
                </tr>
                <tr>
                    <td>Moms {dataset.vat_rate.toFixed(2)}%</td>
                    <td className="text-end">
                        {formatIntegerAsMoneyWithSeparatorsAndSymbol(vat, currency)}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>SUMMA ATT BETALA</strong>
                    </td>
                    <td className="text-end">
                        {formatIntegerAsMoneyWithSeparatorsAndSymbol(totalWithVat, currency)}
                    </td>
                </tr>
                </tbody>
            </table>
        </React.Fragment>
    )
}


type State = {
    datasetIndex: number | undefined
    invoice: t.Invoice
    invoiceBlob: { blob: Blob, url: string } | undefined
}

function ensureHasEmptyItem(invoice: t.Invoice): t.Invoice {
    const items = invoice.line_items;
    const last = items[items.length - 1] || emptyItem({});

    if (!last.name) {
        return invoice;
    }

    const empty = emptyItem({
        price: last.price,
    });
    return {
        ...invoice,
        line_items: items.concat(empty),
    };
}

const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
};

export const InvoicePage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        datasetIndex: undefined,
        invoice: {
            fields: [],
            line_items: [],
        },
        invoiceBlob: undefined,
    });

    const datasets = props.datasets;
    const timeout = React.useRef<number>();

    function getInvoiceBlob(): PromiseLike<Blob> {
        if (typeof state.datasetIndex === 'undefined') {
            return Promise.reject();
        }
        const dataset = props.datasets[state.datasetIndex];
        const request: LeifRequest = {
            method: 'POST',
            url: '/app/pdf',
            body: {
                invoice_dataset_id: dataset?.invoice_dataset_id,
                invoice: state.invoice,
            },
        };
        return props.http(request);
    }

    function scheduleInvoiceUpdate() {
        if (typeof timeout.current !== 'undefined') {
            window.clearTimeout(timeout.current);
            timeout.current = undefined;
        }
        timeout.current = window.setTimeout(() => {
            if (!state.invoice.line_items.length) {
                return;
            }
            if (state.invoiceBlob) {
                window.URL.revokeObjectURL(state.invoiceBlob.url);
            }
            getInvoiceBlob().then(res => {
                const url = window.URL.createObjectURL(res);

                setState(prev => {
                    return {
                        ...prev,
                        invoiceBlob: {
                            blob: res,
                            url: url,
                        },
                    }
                });
            });
        }, 500);
    }

    React.useEffect(scheduleInvoiceUpdate, [state.invoice]);

    const dataset = typeof state.datasetIndex !== 'undefined'
        ? datasets[state.datasetIndex]
        : undefined;

    return (
        <div className="row mb-3">
            <div className="col-6">
                <div className="mb-3">
                    <label className="form-label">Mall</label>
                    <select className="form-control"
                            onChange={event => {
                                const id = parseInt(event.target.value)
                                const def = datasets[id];

                                if (!def) {
                                    return;
                                }

                                const invoice: t.Invoice = {
                                    fields: def.fields,
                                    line_items: def.line_items.length > 0
                                        ? def.line_items
                                        : [emptyItem({})],
                                };

                                setState({
                                    datasetIndex: id,
                                    invoice: ensureHasEmptyItem(invoice),
                                    invoiceBlob: state.invoiceBlob,
                                });
                            }}
                            value={state.datasetIndex}
                            required>
                        <option>Välj mall</option>
                        {datasets.map((def, idx) => {
                            return (
                                <option key={idx} value={idx}>
                                    {def.name}
                                </option>
                            )
                        })}
                    </select>
                </div>

                {dataset
                    ? <Form
                        dataset={dataset}
                        invoice={state.invoice}
                        onChange={invoice => {
                            setState({
                                datasetIndex: state.datasetIndex,
                                invoice: ensureHasEmptyItem(invoice),
                                invoiceBlob: state.invoiceBlob,
                            });
                        }}
                    />
                    : null}

                <div className="d-grid">
                    <button
                        disabled={!dataset}
                        onClick={event => {
                            event.preventDefault();

                            getInvoiceBlob().then(res => {
                                // downloadBlobWithName(res, `invoice-${state.invoice.fields['id']}.pdf`);
                            });
                        }}
                        className="btn btn-success">
                        Hämta PDF
                    </button>
                </div>
            </div>
            <div className="col-6">
                {state.invoiceBlob
                    ? <iframe style={iframeStyle} src={state.invoiceBlob.url} />
                    : undefined }
            </div>
        </div>
    );
};
