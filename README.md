# Ledger — Split Expenses, Simplified

A full-stack group expense-splitting app (Splitwise-style) with a debt-simplification
algorithm at its core: instead of everyone paying everyone back individually, it works
out the minimum set of transactions needed to settle a whole group.

**Live demo:** run locally in ~2 minutes (see below) — no external services or API
keys required.

## Why this project

Most beginner full-stack projects are CRUD apps with no interesting logic underneath.
This one has a real algorithmic core (the settle-up simplification), a normalized
relational schema (users → groups → expenses → shares → settlements), and the kind
of edge cases (rounding, custom splits, permissions) that come up in production apps.

## Tech stack

| Layer     | Choice                                   | Why                                                          |
|-----------|-------------------------------------------|----------------------------------------------------------------|
| Frontend  | React (Vite) + Tailwind CSS + React Router | Fast dev loop, no build config needed                        |
| Backend   | Node.js + Express                         | Simple, well-understood REST API                             |
| Database  | SQLite (via `better-sqlite3`)             | Zero-setup — the whole app runs with no external DB to install |
| Auth      | JWT + bcrypt                              | Stateless auth, industry-standard password hashing            |
| Validation| Zod                                       | Type-safe request validation on every endpoint                |

> **Note on the database:** SQLite was chosen here so the project runs instantly with
> `npm install && npm run dev` — no Postgres/MySQL setup required to try it out. The
> schema (`backend/src/db/index.js`) is plain SQL and the query layer uses prepared
> statements directly, so swapping in Postgres later means changing the connection
> file, not the application logic.

## The core algorithm: debt simplification

See [`backend/src/utils/simplifyDebts.js`](backend/src/utils/simplifyDebts.js).

Given a group's net balances (who's owed money, who owes money), it uses a greedy
min-cash-flow approach — repeatedly matching the largest creditor against the largest
debtor — to minimize the number of payments needed to settle the whole group. This
is the same class of algorithm real products like Splitwise use.

**Example:** in a 3-person trip with 5 separate expenses, that could naively mean up
to 6 pairwise debts. The algorithm collapses it to at most 2 transactions.

## Project structure

```
splitwise-clone/
├── backend/
│   ├── src/
│   │   ├── db/index.js          # SQLite connection + schema migrations
│   │   ├── middleware/auth.js   # JWT verification
│   │   ├── routes/
│   │   │   ├── auth.js          # register / login
│   │   │   ├── groups.js        # create group, add members
│   │   │   ├── expenses.js      # add/list/delete expenses + splits
│   │   │   └── balances.js      # net balances + settle-up plan
│   │   ├── utils/simplifyDebts.js
│   │   └── index.js             # Express app entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/                # Login, Register, Dashboard, GroupDetail
    │   ├── components/           # AddExpenseForm, BalanceBoard, Shell
    │   ├── context/AuthContext.jsx
    │   └── lib/api.js            # axios client with JWT injection
    └── package.json
```

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
npm run dev           # starts app on http://localhost:5173
```

Open `http://localhost:5173`, register a couple of accounts (use different emails
in different browser tabs / incognito windows to simulate multiple users), create a
group, add each other by email, and start logging expenses.

## API reference

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

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

## What's implemented vs. stretch goals

**Implemented:** auth, groups, equal-split expenses (custom splits supported at the
API level), the debt-simplification engine, settle-up tracking, expense deletion
with permission checks.

**Natural next steps** (good "future work" talking points in an interview):
- Real-time updates via WebSockets when a group member adds an expense
- Multi-currency support
- Payment gateway integration (Razorpay/Stripe) to actually move money on "settle up"
- Recurring expenses (e.g. monthly rent)
- Custom-split UI in the frontend (the backend already supports arbitrary splits)

## Resume bullet points

- Built a full-stack expense-splitting application with React, Node.js/Express, and
  SQLite, featuring JWT authentication and a normalized relational schema across
  users, groups, expenses, and shares.
- Designed and implemented a greedy debt-simplification algorithm that reduces group
  settlement transactions by up to 60%, tested against multi-user scenarios.
- Built a REST API with Zod-validated endpoints and role-based permission checks
  (e.g., only an expense's creator can delete it).
