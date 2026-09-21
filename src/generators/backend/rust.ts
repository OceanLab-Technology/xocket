import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEFAULT_PORTS } from './types.js';

/** An Axum service, wired into Turborepo through a package.json shim. */
export async function generateRustService(_config: Config, targetDir: string, name: string) {
  const port = DEFAULT_PORTS.rust;
  // Cargo crate names cannot contain hyphens in the binary target.
  const crateName = name.replace(/-/g, '_');

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '0.0.0',
        private: true,
        scripts: {
          dev: 'cargo run',
          build: 'cargo build --release',
          start: `./target/release/${crateName}`,
          lint: 'cargo clippy -- -D warnings',
          'type-check': 'cargo check',
          test: 'cargo test',
        },
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'turbo.json'),
    JSON.stringify(
      { extends: ['//'], tasks: { build: { outputs: ['target/release/**'] } } },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'Cargo.toml'),
    `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[[bin]]
name = "${crateName}"
path = "src/main.rs"
`,
  );

  await ensureDir(path.join(targetDir, 'src'));
  await writeFile(
    path.join(targetDir, 'src', 'main.rs'),
    `use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::env;

#[derive(Serialize)]
struct Health {
    status: &'static str,
    service: &'static str,
}

async fn health() -> Json<Health> {
    Json(Health {
        status: "ok",
        service: "${name}",
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health));

    let port = env::var("PORT").unwrap_or_else(|_| "${port}".to_string());
    let addr = format!("0.0.0.0:{port}");

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("failed to bind");

    println!("${name} listening on http://localhost:{port}");
    axum::serve(listener, app).await.expect("server error");
}
`,
  );

  await writeFile(path.join(targetDir, '.gitignore'), `target/\n`);
  await writeFile(path.join(targetDir, '.env.example'), `PORT=${port}\n`);
}
