import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';
import { DEFAULT_PORTS } from './types.js';

/**
 * A Go service exposed to Turborepo through a package.json shim.
 *
 * The shim declares no dependencies — pnpm treats it as an empty workspace
 * package, while `turbo build` runs `go build` and caches ./bin.
 */
export async function generateGoService(_config: Config, targetDir: string, name: string) {
  const port = DEFAULT_PORTS.go;

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '0.0.0',
        private: true,
        scripts: {
          dev: 'go run .',
          build: 'go build -o bin/server .',
          start: './bin/server',
          lint: 'go vet ./...',
          'type-check': 'go build -o /dev/null ./...',
          test: 'go test ./...',
        },
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'turbo.json'),
    JSON.stringify({ extends: ['//'], tasks: { build: { outputs: ['bin/**'] } } }, null, 2) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'go.mod'),
    `module ${name}

go 1.24
`,
  );

  await writeFile(
    path.join(targetDir, 'main.go'),
    `package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type health struct {
	Status  string \`json:"status"\`
	Service string \`json:"service"\`
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health{Status: "ok", Service: "${name}"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "${port}"
	}

	log.Printf("${name} listening on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
`,
  );

  await writeFile(path.join(targetDir, '.gitignore'), `bin/\n`);
  await writeFile(path.join(targetDir, '.env.example'), `PORT=${port}\n`);
}
