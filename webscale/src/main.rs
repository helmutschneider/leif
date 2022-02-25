mod db;
mod get_workbook;
mod types;

use actix_web::{web, App, HttpResponse, HttpServer, Responder};

async fn index() -> impl Responder {
    return HttpResponse::Ok().json("Yee!");
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_path = format!(
        "{}/{}",
        std::env::current_dir().unwrap().to_str().unwrap(),
        "/../var/app.db"
    );
    let db = db::Database::sqlite_open(&db_path);

    HttpServer::new(move || {
        App::new()
            .data(db.clone())
            .route("/", web::get().to(index))
            .route("/workbook", web::get().to(get_workbook::invoke))
    })
    .bind("127.0.0.1:8000")?
    .run()
    .await
}
