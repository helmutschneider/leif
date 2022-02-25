use crate::db::DatabaseRow;
use crate::db::FromDatabaseRow;
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
pub struct User {
    pub user_id: Option<i64>,
    pub username: String,
    pub password_hash: String,
    pub created_at: Option<String>,
    pub carry_accounts: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct Token {
    pub token_id: Option<i64>,
    pub value: Vec<u8>,
    pub seen_at: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Voucher {
    pub voucher_id: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub date: String,
    pub name: String,
    pub notes: Option<String>,
    pub is_template: bool,
    pub transactions: Vec<Transaction>,
}

impl FromDatabaseRow for Voucher {
    fn from_row(row: &dyn DatabaseRow) -> Self {
        return Voucher {
            voucher_id: row.get_i64("voucher_id"),
            created_at: row.get_string("created_at"),
            updated_at: row.get_string("updated_at"),
            date: row.get_string("date").unwrap(),
            name: row.get_string("name").unwrap(),
            notes: row.get_string("notes"),
            is_template: row.get_bool("is_template").unwrap(),
            transactions: Vec::with_capacity(0),
        };
    }
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct TransactionData {
    pub transaction_id: Option<i64>,
    pub account: i64,
    pub amount: i64,
    pub voucher_id: Option<i64>,
}

#[derive(Clone, Copy, Debug, Serialize)]
#[serde(tag = "kind")]
pub enum Transaction {
    #[serde(rename = "credit")]
    Credit(TransactionData),

    #[serde(rename = "debit")]
    Debit(TransactionData),
}

impl Transaction {
    pub fn data(self) -> TransactionData {
        return match self {
            Transaction::Credit(data) => data,
            Transaction::Debit(data) => data,
        };
    }
}

impl FromDatabaseRow for Transaction {
    fn from_row(row: &dyn DatabaseRow) -> Self {
        let kind = row.get_i64("kind").unwrap();
        let data = TransactionData {
            transaction_id: row.get_i64("transaction_id"),
            account: row.get_i64("account").unwrap(),
            amount: row.get_i64("amount").unwrap(),
            voucher_id: row.get_i64("voucher_id"),
        };

        return match kind {
            0 => Transaction::Credit(data),
            1 => Transaction::Debit(data),
            _ => panic!("Invalid transaction kind '{}'.", kind),
        };
    }
}
