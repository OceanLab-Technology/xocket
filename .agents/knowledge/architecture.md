# Architecture Overview

## Project Structure
This is the `xocket` CLI tool, a Monorepo Development Platform scaffold. It is a Node.js CLI written in TypeScript.

### Directories
- **`src/cli`**: Contains command logic for CLI (e.g. `create`, `add`).
- **`src/generators`**: Contains logic to generate specific parts of the project.
- **`src/utils`**: Reusable utilities for the CLI tool.
- **`templates`**: Holds the template boilerplate code that the CLI copies. Subdirectories like `expo`, `next`, and `react` correspond to different modules that can be generated.

### Entry Point
- **`src/index.ts`**: The main entry point for the CLI using Commander.js. Provides commands like `xocket create [name]` and `xocket add <module>`.

### Core Dependencies
- **`commander`**: Command-line interface building.
- **`@clack/prompts`**: Interactive CLI prompts.
- **`execa`**: Process execution.
- **`fs-extra`**: Advanced file system operations.
- **`ora`**: Terminal spinners.
- **`picocolors`**: Terminal string styling.

## Build Process
- Compiled using `tsc` or executed in dev via `tsx`.
- Outputs compiled files to `dist/`.
