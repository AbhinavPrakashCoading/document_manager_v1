# 📦 Document Manager v2

A modular, schema-driven platform for validating and packaging exam documents — dynamically adapting to any exam via real-time scraping and schema injection.

## 🚀 Features

- Dynamic schema ingestion via scraping engine
- Real-time file validation (format, size, dimensions)
- ZIP packaging with schema-driven naming
- Modular architecture (schema, validator, upload, packaging)

## 🧱 Tech Stack

- Next.js + TypeScript
- Tailwind + Radix UI
- JSZip + FileSaver
- Vitest + React Testing Library
- Puppeteer (for scraping engine)

## 📂 Modules

| Module         | Description                                      |
|----------------|--------------------------------------------------|
| `examSchema`   | Defines document requirements per exam           |
| `validator`    | Validates files against dynamic schema           |
| `uploadHook`   | Manages file selection and validation state      |
| `zipService`   | Packages validated files into structured ZIPs    |
| `scraperEngine`| Scrapes exam portals and generates schemas       |

## 🧪 Tests

```bash
pnpm test
