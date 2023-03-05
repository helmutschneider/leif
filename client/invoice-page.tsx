import * as React from 'react';
import * as t from './types'
import {HttpSendFn} from "./http";

type Props = {
    http: HttpSendFn
    user: t.User
}

export const InvoicePage: React.FC<Props> = props => {
    return (
        <div>Yee</div>
    )
};
