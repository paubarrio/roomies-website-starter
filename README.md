# Roomies — roommate website (Next.js + Tailwind)

This is a working starter you can deploy. It includes:
- Calendars tab with per-roommate visibility and time suggestions
- Chores with recurrence labels, assignees, and filters
- Costs & Groceries with splits, balances, and price memory
- Live design panel (accent color, corner radius, compact layout)

## Quick start
```bash
# 1) Install dependencies
npm install

# 2) Run locally
npm run dev
# open http://localhost:3000

# 3) Build for prod
npm run build && npm start
```

## Deploy
- **Vercel:** import the repo, no extra config needed.
- **Netlify/Fly/Railway:** build command `npm run build`, publish `.next` with `next start` or use Next adapters.

## Next steps (hooks ready in the code)
- Wire OAuth for Google Calendar & Microsoft 365 (Graph) to fetch free/busy.
- Add a DB (PostgreSQL + Prisma) for persistence (households, chores, expenses, proposals).
- Create API routes (`src/app/api/...`) for proposals, chores, expenses.
- Add webhook subscribers for calendar updates.
- Extend the grocery list with stores and price history.

