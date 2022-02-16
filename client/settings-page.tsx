import * as React from 'react'
import {MoneyInput} from "./money-input";
import {Currency, Workbook, accounts} from "./types";
import {findNextUnusedAccountNumber, tryParseInt} from "./util";
import {HttpBackend} from "./http";
import {Autocomplete} from "./autocomplete";

type Props = {
    currency: Currency
    http: HttpBackend
    onChange: (next: Workbook) => unknown
    workbook: Workbook
}

export const SettingsPage: React.FC<Props> = props => {
    const workbook = props.workbook

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
                                props.onChange({
                                    ...workbook,
                                    name: event.target.value,
                                })
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
                                props.onChange({
                                    ...workbook,
                                    year: tryParseInt(event.target.value, 0),
                                })
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
                            {Object.entries(workbook.balance_carry).map((e, index) => {
                                return (
                                    <tr key={index}>
                                        <td className="col-6">
                                            <Autocomplete
                                                data={accounts}
                                                itemMatches={(item, query) => {
                                                    return JSON.stringify(item).includes(query);
                                                }}
                                                onChange={event => {
                                                    const next = {
                                                        ...workbook.balance_carry,
                                                    };
                                                    delete next[e[0]];
                                                    next[event.target.value] = 0;

                                                    props.onChange({
                                                        ...workbook,
                                                        balance_carry: next,
                                                    });
                                                }}
                                                onItemSelected={item => {

                                                }}
                                                renderItem={item => {
                                                    return `${item.number}: ${item.name}`;
                                                }}
                                                value={e[0]}
                                            />
                                        </td>
                                        <td>
                                            <MoneyInput
                                                currency={props.currency}
                                                onChange={next => {
                                                    const wb: Workbook = {
                                                        ...workbook,
                                                        balance_carry: {
                                                            ...workbook.balance_carry,
                                                            [e[0]]: next,
                                                        },
                                                    };
                                                    props.onChange(wb);
                                                }}
                                                value={e[1]}
                                            />
                                        </td>
                                        <td>
                                            <i
                                                className="bi bi-x-circle-fill"
                                                onClick={event => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    const next = {
                                                        ...workbook.balance_carry,
                                                    };
                                                    delete next[e[0]];

                                                    props.onChange({
                                                        ...workbook,
                                                        balance_carry: next,
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
                        <div className="d-grid">
                            <button
                                className="btn btn-secondary"
                                onClick={event => {
                                    event.preventDefault()
                                    event.stopPropagation()

                                    const nextAccountNumber = findNextUnusedAccountNumber(workbook.balance_carry);
                                    const wb: Workbook = {
                                        ...workbook,
                                        balance_carry: {
                                            ...workbook.balance_carry,
                                            [nextAccountNumber!]: 0,
                                        },
                                    };
                                    props.onChange(wb);
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

                    props.http.send({
                        method: 'PUT',
                        url: `/api/workbook/${workbook.workbook_id}`,
                        body: workbook,
                    });
                }}
            >
                Spara
            </button>
        </div>

    )
};
