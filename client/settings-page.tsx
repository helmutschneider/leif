import * as React from 'react'
import {accountOptions} from "./voucher-form";
import {MoneyInput} from "./money-input";
import accounts from "../data/accounts-2022.json";
import {Currency, Workbook} from "./types";
import {tryParseInt} from "./util";

type Props = {
    currency: Currency
    onChange: (next: Workbook) => unknown
    workbook: Workbook
}

export const SettingsPage: React.FC<Props> = props => {
    const workbook = props.workbook

    return (
        <div className="row">
            <div className="col-4">
                <h5>Ingående kontobalans</h5>
                <table className="table table-sm align-middle">
                    <tbody>
                    {Object.entries(workbook.balance_carry).map((e, index) => {
                        return (
                            <tr key={index}>
                                <td className="col-6">
                                    <select
                                        className="form-control"
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
                                        value={e[0]}
                                    >
                                        {accountOptions}
                                    </select>
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
                <div className="d-grid mb-1">
                    <button
                        className="btn btn-secondary"
                        onClick={event => {
                            event.preventDefault()
                            event.stopPropagation()

                            const largestAccountNumber = Math.max(
                                ...Object.keys(workbook.balance_carry).map(k => tryParseInt(k, 0))
                            )
                            const accountNumbers = Object.keys(accounts);
                            const indexOfLargestAccountNumber = accountNumbers.indexOf(largestAccountNumber.toFixed(0));
                            const nextAccountNumber = accountNumbers[indexOfLargestAccountNumber + 1];
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
                <div className="d-grid">
                    <button
                        className="btn btn-success"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
};
