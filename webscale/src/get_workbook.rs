use crate::db::Database;
use crate::types::Transaction;
use crate::types::Voucher;
use actix_web::{web::Data, HttpResponse, Responder};
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
struct Workbook<'a> {
    vouchers: &'a [Voucher],
}

const GET_VOUCHERS_SQL: &'static str = r#"
SELECT v.*
  FROM voucher AS v
"#;

const GET_TRANSACTIONS_SQL: &'static str = r#"
SELECT t.*
  FROM "transaction" AS t
"#;

trait GroupBy<T> {
    fn group_by_fn<R, F>(self, f: F) -> HashMap<R, Vec<T>>
    where
        R: std::hash::Hash + Eq,
        F: FnMut(&T) -> R;
}

impl<T: Clone> GroupBy<T> for Vec<T> {
    fn group_by_fn<R, F>(self, mut f: F) -> HashMap<R, Vec<T>>
    where
        R: std::hash::Hash + Eq,
        F: FnMut(&T) -> R,
    {
        let mut map: HashMap<R, Vec<T>> = HashMap::new();

        for item in self {
            let key = f(&item);
            let entry = map.entry(key).or_insert(Vec::new());
            entry.push(item.clone());
        }

        return map;
    }
}

pub async fn invoke(db: Data<Database>) -> impl Responder {
    let mut vouchers: Vec<Voucher> = db.select_all(GET_VOUCHERS_SQL);
    let transactions_by_voucher_id = db
        .select_all(GET_TRANSACTIONS_SQL)
        .group_by_fn(|t: &Transaction| t.data().voucher_id);

    for v in &mut vouchers {
        let transactions = transactions_by_voucher_id.get(&v.voucher_id).unwrap();
        v.transactions.extend(transactions);
    }

    let wb = Workbook {
        vouchers: &vouchers,
    };

    return HttpResponse::Ok().json(wb);
}
