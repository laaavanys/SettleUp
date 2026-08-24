# Ledger — Smart Expense Sharing & AI Settlement Engine

A modern full-stack group expense-sharing platform with a real-time debt-simplification engine and 5 integrated AI features: natural language prompt extraction, speech-to-text voice assistant, receipt scanning, duplicate expense detection, and AI financial insights.

**Live demo:** run locally in ~2 minutes (see below).

## Features & Highlights

- **5 AI Assistants**:
  1. **AI Natural Language Prompt Extractor**: Parse prompt sentences into structured expenses (`description`, `amount`, `category`, `paidBy`).
  2. **AI Voice Expense Assistant**: Speech-to-text voice assistant using Web Speech API.
  3. **AI Receipt & Invoice Parser**: Paste raw text from receipts for instant extraction.
  4. **AI Group Financial Insights**: Generates financial health summaries and category analysis.
  5. **AI Duplicate Expense Detector**: Real-time warning for duplicate group entries.
- **Debt Simplification Engine**: Min-cash-flow greedy graph algorithm that minimizes overall transactions needed to settle a group.
- **Multi-Member Group Invites**: Add friends by email seamlessly during group creation or inside group details.
- **Fresh Pastel UI**: Custom 2-column layout with vertical icon navigation sidebar, rounded canvas, and zero emojis.

## Tech stack

| Layer     | Choice                                   | Why                                                          |
|-----------|-------------------------------------------|----------------------------------------------------------------|
| Frontend  | React (Vite) + Tailwind CSS + Lucide Icons| Fast dev loop, high performance, clean vector icons           |
| Backend   | Node.js + Express + Google GenAI SDK      | Scalable REST API with AI integration                          |
| Database  | SQLite (via `better-sqlite3`)             | Zero-setup — whole app runs locally with no DB config required |
| Auth      | JWT + bcrypt                              | Industry-standard password hashing and token authentication   |
| Validation| Zod                                       | Type-safe request validation on every endpoint                |

## Getting started

**Requirements:** Node.js 18+

```bash
# 1. Backend
cd backend
npm install
npm run dev          # starts API on http://localhost:4000

# 2. Frontend (in a new terminal)
cd frontend
npm install
npm run dev           # starts app on http://localhost:5179
```

Open `http://localhost:5179`, register accounts, create expense groups, invite members, and start tracking shared expenses.

## API Reference

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Endpoint                       | Description                              |
|--------|----------------------------------|-------------------------------------------|
| POST   | `/api/auth/register`            | Create an account                        |
| POST   | `/api/auth/login`               | Log in                                   |
| POST   | `/api/groups`                   | Create a group                           |
| GET    | `/api/groups`                   | List your groups                         |
| GET    | `/api/groups/:id`                | Group details + members                  |
| POST   | `/api/groups/:id/members`        | Add a member by email                    |
| POST   | `/api/expenses`                 | Add an expense (equal or custom split)   |
| GET    | `/api/expenses/group/:groupId`   | List a group's expenses                  |
| DELETE | `/api/expenses/:id`              | Delete an expense (only its creator)     |
| GET    | `/api/balances/:groupId`         | Net balances + simplified settle-up plan |
| POST   | `/api/balances/:groupId/settle`  | Record a payment between two members     |
| POST   | `/api/ai/parse-prompt`           | AI prompt text parser                    |
| POST   | `/api/ai/parse-receipt`          | AI receipt text scanner                  |
| GET    | `/api/ai/insights/:groupId`      | AI group financial insights              |
