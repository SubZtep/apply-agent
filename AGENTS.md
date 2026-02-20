# AGENTS.md - apply-agent

## Project Overview

apply-agent is a Bun/TypeScript application that automates job application filtering using AI. It reads scraped job listings, scores them against a candidate's CV, and manages the application workflow through a state machine.

## Commands

### Running the Application
```bash
bun start                           # Run the main orchestrator
python tools/scraper/scrape.py      # Start to scrape jobs
bun cli ingest                      # Ingest scraped jobs
bun cli scoring                     # Batch scoring ingested jobs
bun cli evalution                   # Evaluate shortlisted jobs
```

### Linting & Formatting
```bash
bun lint               # Check code with Biome
bun lint:fix           # Auto-fix linting issues
```

### Testing
```bash
bun test                   # Run all tests
bun test <file>            # Run specific test file
bun test <pattern>         # Run tests matching pattern
```

### Development
```bash
bun install                # Install dependencies (runs postinstall setup)
```

## Code Style Guidelines

### Formatting (Biome)
- Line width: 120 characters
- Quote style: double quotes
- Semicolons: as-needed
- Use Biome for formatting: `bun run lint:fix`

### TypeScript Conventions
- **Strict mode enabled** - all strict checks are on
- Use explicit types for function parameters and return types
- Use `type` for simple type aliases, `interface` for complex/object types
- Avoid `any` - use `unknown` when type is truly unknown
- Use `noUncheckedIndexedAccess: true` - array access returns `T | undefined`
- Use `noImplicitOverride: true` - always use `override` keyword when overriding

### Imports
- Use path alias `#/...` for internal imports (mapped to `./src/*`)
- Example: `import { something } from "#/machine/handlers"`
- Group imports: external libs → internal modules → types

### Naming Conventions
- **Files**: kebab-case (e.g., `batch-run.ts`, `machine-handlers.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Job`, `AgentStore`)
- **Functions/Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE for env vars, camelCase otherwise
- **Booleans**: prefix with `is`, `has`, `should`, `can` (e.g., `isValid`, `hasData`)

### Error Handling
- Use try/catch for async operations that may fail
- Use Zod for runtime validation of external data (jobs, configs)
- Throw descriptive errors with context: `throw new Error("Failed to X because Y")`
- Use Result types pattern: `{ ok: true; data: T } | { ok: false; error: E }`

### State Machine
- State handlers are async functions returning the next state
- StatesLE →: ID INGEST → NORMALIZE → PLAN → CHALLENGE → EXECUTE → DONE
- Error states: FAILED, WAIT_FOR_HUMAN

### Testing
- Tests use `bun:test` framework
- Use `describe` blocks for test suites
- Mock external dependencies (AI calls, file system)
- Keep tests self-contained - don't rely on `data/` files

### Environment Variables
- All env vars are defined in `env.d.ts` with JSDoc comments
- Required vars: `CV_FILE`, `JOBS_DIR`, `AGENT_MODEL`
- Use `process.env.VAR_NAME` directly (Bun provides typed env)

### Patterns to Use with Caution
- ❌ Top-level `await` at module scope (lazy-load instead)
- ❌ Reading files at import time
- ❌ Using the `any` type
- ❌ Non-null assertions (`!`) without justification
- ❌ Unused imports or variables (Biome will warn)

### Project Structure
```
.
├── data                      # Base folder for app data (gitignored, configurable)
│   ├── cv.md                 # Your CV
│   └── jobs                  # Temporary job states folders
│       ├── approved          # Final job state, ready to apply
│       ├── awaiting_input    # User input required
│       ├── declined          # Evaluation rejects
│       ├── inbox             # Raw job listings
│       ├── screened_out      # Batch rejects
│       └── shortlisted       # Batch accepts
├── docs                      # User documentation
├── scripts                   # Project setup and validation
│   └── lib                   # Script helpers
├── src
│   ├── score                 # Batch job processing
│   ├── lib                   # Utilities (AI, logging, storage)
│   ├── machine               # State machine (handlers, types, runner)
│   │   └── states            # State-specific logic (evaluate, plan, normalize)
│   └── schemas               # Zod schemas for validation
├── tests
│   ├── integration           # Integration tests
│   └── unit                  # Unit tests
└── tools
    └── scraper               # 3rd-party Python job scraper
```
