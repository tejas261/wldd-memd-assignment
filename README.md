# Meme’d — Campaign Payout Tracker

Brands create campaigns with a budget and view milestones. Creators submit an Instagram or YouTube post and track the earnings from it.

[Live app](https://memed-payout-tracker.vercel.app)

Built with Next.js and TypeScript, Express, Mongoose and MongoDB Atlas. Authentication uses JWTs in an HTTP-only cookie.

The frontend uses shadcn/ui (Radix) components with a dark Tailwind theme. Shared primitives live in `frontend/src/components/ui`; `frontend/components.json` configures the component generator.

## Setup

Use Node 24 and a MongoDB Atlas database (or a local MongoDB replica set). Transactions need a replica set; a standalone MongoDB instance won't work.

```sh
nvm use
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

In `backend/.env`, set `MONGODB_URI` to your connection string and `JWT_SECRET` to a random secret of at least 32 characters. You can generate one with `openssl rand -hex 32`.

```sh
npm run seed   # optional demo data
npm run dev
```

The frontend runs at http://localhost:3000 and the API at http://localhost:4000.

| Variable        | Where    | Value                                                               |
| --------------- | -------- | ------------------------------------------------------------------- |
| `MONGODB_URI`   | Backend  | Atlas or replica-set connection string, including the database name |
| `JWT_SECRET`    | Backend  | Random secret, at least 32 characters                               |
| `FRONTEND_URL`  | Backend  | `http://localhost:3000` locally; the frontend URL when deployed     |
| `PORT`          | Backend  | `4000` by default                                                   |
| `NODE_ENV`      | Backend  | `development` locally, `production` when deployed                   |
| `LOG_LEVEL`     | Backend  | `info` by default                                                   |
| `COOKIE_SECURE` | Backend  | Optional override; secure cookies default on in production          |
| `API_URL`       | Frontend | API origin, `http://127.0.0.1:4000` locally                         |

The frontend forwards `/api` requests to Express, so browser requests and cookies use one origin. `API_URL` is read at build time.

## Project structure

```text
backend/
  src/
    router/       # auth, campaign, submission and creator endpoints
    services/     # authentication and campaign/submission logic
    models/       # User, Campaign and Submission schemas
    config/       # environment variables and database connection
    middleware/   # authentication, roles and error handling
    validation/   # request schemas
    utils/        # payout calculation, URL normalization, errors and logging
    app.ts        # Express application
    server.ts     # local server entry point
  scripts/        # demo seed script
  tests/          # payout and budget cap tests
frontend/src/
  app/            # Next.js pages and layout
  components/     # forms, dashboards and shared UI
  hooks/          # session and resource loading
  types/          # shared API types
  utils/          # API requests, error messages and formatting
```

## Demo

These accounts are available on the live app and through the local seed:

| Role    | Email                | Password       |
| ------- | -------------------- | -------------- |
| Brand   | `brand@memed.demo`   | `MemeDemo123!` |
| Creator | `creator@memed.demo` | `MemeDemo123!` |

Create a campaign as a brand, then sign in as a creator. **Live campaigns** lists campaigns with budget available, 10 per page; submit a post link there to join. The creator dashboard shows only campaigns you’ve submitted to, five per page, including campaigns that have used their budget. Each campaign includes its post and payout controls. Use **Simulate views** to update the post's total views. For the default ladder, 50,000 views earns ₹2,000; updating to 100,000 adds ₹3,000 if enough budget remains. The brand sees the same amount deducted from its budget.

The seed adds three campaigns and an example submission. Its post URL is a placeholder. Rerunning the seed doesn't clear existing data.

## Payout assumptions

- Milestones are cumulative. Crossing several at once pays the highest milestone, not their sum. Only the unpaid difference is credited.
- If the remaining budget is too small, the creator gets a partial payout. The UI shows the amount left uncredited. There is no budget top-up or automatic settlement.
- Views only increase. Repeated or lower counts don't double-pay or reduce earnings.
- Amounts are whole INR rupees. There is one post per creator per campaign, and the same post can't be claimed twice in a campaign.
- A campaign is live while it has budget remaining. There are no scheduled dates or campaign editing.
- The view-update endpoint needs a login but accepts either role. It takes a total count, not an increment.
- Earnings are recorded in the database; there are no real transfers. Post URLs are validated, but ownership and actual view counts aren't checked with Instagram or YouTube.

Payouts update the submission and campaign in one MongoDB transaction. Concurrent updates retry against the current balance so they can't overspend or pay twice. Old spike-detection fields, if present in an existing database, are unused; no data migration is needed.

## Tests

```sh
npm test
npm run typecheck
npm run build
```

Jest unit tests cover payout calculation and the budget cap, including milestone thresholds, incremental payouts, and partial or exhausted budgets. These tests don't need a database or environment variables.

## Deployment

There are two Vercel projects, with root directories `backend` and `frontend`, both using Node 24. Set the backend environment variables above, allow the API host to connect to Atlas, and set the frontend's `API_URL` to the deployed backend origin before building. Set backend `FRONTEND_URL` to the frontend's public URL. `/api/health` checks database connectivity.

Redis caching, spike detection, Docker packaging and the scaling write-up are not included. The UI layout follows [Mantis Free](https://codedthemes.com/item/mantis-free-figma-ui-kit/) with a custom dark palette.
