use std::sync::Arc;
use std::sync::Mutex;

#[derive(Clone, Debug)]
pub struct Database {
    conn: Arc<Mutex<rusqlite::Connection>>,
}

impl Database {
    pub fn sqlite_open(dsn: &str) -> Self {
        let conn = rusqlite::Connection::open(dsn).unwrap();
        return Self {
            conn: Arc::new(Mutex::new(conn)),
        };
    }

    pub fn execute(&self, query: &str) {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query).unwrap();
        stmt.execute([]).unwrap();
    }

    pub fn select_all<T>(&self, query: &str) -> Vec<T>
    where
        T: FromDatabaseRow,
    {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query).unwrap();
        let mut rows = stmt.query([]).unwrap();
        let mut out: Vec<T> = Vec::new();
        while let Ok(Some(row)) = rows.next() {
            out.push(T::from_row(row));
        }
        return out;
    }
}

pub trait DatabaseRow {
    fn get_i64(&self, column: &str) -> Option<i64>;
    fn get_f64(&self, column: &str) -> Option<f64>;
    fn get_bool(&self, column: &str) -> Option<bool>;
    fn get_string(&self, column: &str) -> Option<String>;
    fn get_blob(&self, column: &str) -> Option<Vec<u8>>;
}

impl DatabaseRow for rusqlite::Row<'_> {
    fn get_i64(&self, column: &str) -> Option<i64> {
        return self.get(column).ok();
    }

    fn get_bool(&self, column: &str) -> Option<bool> {
        return self.get(column).ok();
    }

    fn get_f64(&self, column: &str) -> Option<f64> {
        return self.get(column).ok();
    }

    fn get_string(&self, column: &str) -> Option<String> {
        return self.get(column).ok();
    }

    fn get_blob(&self, column: &str) -> Option<Vec<u8>> {
        return self.get(column).ok();
    }
}

pub trait FromDatabaseRow {
    fn from_row(row: &dyn DatabaseRow) -> Self;
}
