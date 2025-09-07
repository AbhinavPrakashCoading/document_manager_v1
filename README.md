# 📄 Document Manager MVP

A schema-aware document manager for exam workflows. Supports dynamic schema ingestion, real-time validation, and ZIP packaging.

---

## 🚀 Features

- Dynamic exam schema ingestion (UPSC, SSC, IELTS)
- Real-time file validation (format, size, dimensions)
- Roll number-based ZIP packaging
- Mobile-friendly UI
- CLI stub for schema scraping

---

## 🧩 Folder Structure


src/ components/ ExamSelector.tsx UploadZone.tsx features/ exam/ examSchema.ts upload/ useUpload.ts package/ zipService.ts scraper-engine/ src/ engines/ upsc.ts ssc.ts cli.ts config/ upsc.ts ssc.ts


---

## 🛠️ Usage

### Frontend
```bash
pnpm dev


pnpm cli --exam upsc


📅 Roadmap
[x] UPSC schema ingestion

[x] SSC + IELTS support

[x] ZIP packaging

[ ] Real-time scraper engine

[ ] Upload history

[ ] Freemium limits


🧠 Author
Built by Abhinav — founder, strategist, and builder.

Code

---

Let me know when you’re ready to drop this in, or if you want to tweak the tone or