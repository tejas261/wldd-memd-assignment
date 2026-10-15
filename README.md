# Meme’d — Campaign Payout Tracker

Brands create campaigns with a budget and view milestones. Creators submit an Instagram or YouTube post and track the earnings from it.

[Live app](https://memed-payout-tracker.vercel.app)

For a walkthrough, see [How to use](#how-to-use). To run the app locally, follow [Setup](#setup).

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

## How to use

Open the [live app](https://memed-payout-tracker.vercel.app), or http://localhost:3000 after completing the local setup. Log in with a demo account below, or choose **Create an account**, select **Brand** or **Creator**, and enter your name, email and a password of at least eight characters.

These demo accounts are available on the live app. For a local installation, run `npm run seed` first:

| Role    | Email                | Password       |
| ------- | -------------------- | -------------- |
| Brand   | `brand@memed.demo`   | `MemeDemo123!` |
| Creator | `creator@memed.demo` | `MemeDemo123!` |

Use the **Log out** icon beside your name in the sidebar to switch accounts. You can also use separate browser profiles to keep a brand and creator signed in at the same time.

The seed adds three campaigns and an example submission. Its post URL is a placeholder. Rerunning the seed doesn't clear existing data.

### Create a campaign as a brand

1. Log in as a brand and click **Create campaign** on the dashboard.
2. Enter a campaign name, choose **Instagram** or **YouTube**, and set the **Total budget (₹)**. The budget is shared by all creators in that campaign.
3. Keep the default payout milestones or edit them. Each row sets the total earnings at a view threshold. Use **Add milestone** or the trash icon to change the rows. You can have 1–10 milestones; view thresholds must be unique, payouts must increase with views, and no payout can exceed the campaign budget.
4. Click **Launch campaign**. It becomes available to creators immediately.
5. Use **View submissions** in the campaign's row to see submitted posts, views and credited earnings. The dashboard's **Paid** and **Remaining** columns show how much of the budget has been used. Click **Refresh** to pick up changes made from another account.

### Join a campaign as a creator

1. Log in as a creator and open **Live campaigns** in the sidebar, or click **Browse live campaigns** on the dashboard.
2. Choose a campaign and check its platform, remaining budget and payout milestones.
3. Publish your post on that platform, then click **Submit a post** in Meme’d. Paste the public HTTPS link to your Instagram post/reel or YouTube video/Short and click **Submit post**. Meme’d records the link; it doesn't publish the post for you. Each creator can submit one post per campaign.
4. Follow **View your dashboard** to find it under **My campaigns**. Your views and earnings appear in the campaign row. Click the info icon beside the campaign name to see its payout milestones, or **Open post** to visit your submission.

Live campaigns shows 10 campaigns per page, your creator dashboard shows five joined campaigns per page, and the brand dashboard shows 12 campaigns per page. Use the arrow buttons below each list to change pages. Campaigns with no budget left disappear from Live campaigns but remain on the dashboards of creators who joined them.

### Try a payout update

Views aren't fetched automatically from Instagram or YouTube in this version. On the creator dashboard, expand **Simulate views** under a submitted post, enter its **Total views**, and click **Update views**. Enter the full count each time, rather than just the new views. Brands can use the same control inside **View submissions**.

With a fresh submission, the default milestones and enough remaining budget, try these updates in order:

| Total views entered | Added this update | Total earnings |
| ------------------- | ----------------- | -------------- |
| 50,000              | ₹2,000            | ₹2,000         |
| 100,000             | ₹3,000            | ₹5,000         |
| 100,000 again       | ₹0                | ₹5,000         |

The creator's earnings increase by the amount credited, and the campaign's remaining budget decreases by the same amount. If the budget can't cover the full payout, only the remaining balance is credited; **Budget limited** shows the amount left uncredited. These are tracked earnings for the assignment, with no real money transfers.

## Payout assumptions

- Milestones are cumulative. Crossing several at once pays the highest milestone, not their sum. Only the unpaid difference is credited.
- If the remaining budget is too small, the creator gets a partial payout. The UI shows the amount left uncredited. There is no budget top-up or automatic settlement.
- Views only increase. Repeated or lower counts don't double-pay or reduce earnings.
- Amounts are whole INR rupees. There is one post per creator per campaign, and the same post can't be claimed twice in a campaign.
- A campaign is live while it has budget remaining. There are no scheduled dates or campaign editing.
- The view-update endpoint needs a login but accepts either role. It takes a total count, not an increment.
- Earnings are recorded in the database; there are no real transfers. Post URLs are validated, but ownership and actual view counts aren't checked with Instagram or YouTube.

Payouts update the submission and campaign in one MongoDB transaction. Concurrent updates retry against the current balance so they can't overspend or pay twice. Old spike-detection fields, if present in an existing database, are unused; no data migration is needed.

## Scaling to 10,000 creators

I’d start by checking how many creators are using the app at the same time and how often their views need updating. I haven’t load-tested it with 10,000 creators yet, so that would be the first step before deciding what needs changing.

The dashboard already uses pagination, and there are indexes for the common queries. I’d look for slow queries first. If the API needs more capacity, I’d add instances and check that their combined database connections stay within Atlas limits. Campaign details could also be cached for a short time.

The part I’d watch most closely is several creators earning from the same campaign at once. They all update the same budget, which could cause frequent transaction retries. A queue could process updates one at a time per campaign, while separate campaigns run in parallel. The existing transaction and budget check would still handle payouts; cached balances wouldn’t be used for that.

Once real view fetching is added, I’d run it in background jobs, with retries and limits on calls to Instagram or YouTube. I’d also test duplicate updates and failed jobs to check that retrying them never pays twice or takes a campaign over budget.

## Tests

```sh
npm test
npm run typecheck
npm run build
```

Jest unit tests cover payout calculation and the budget cap, including milestone thresholds, incremental payouts, and partial or exhausted budgets. These tests don't need a database or environment variables.

## Deployment

There are two Vercel projects, with root directories `backend` and `frontend`, both using Node 24. Set the backend environment variables above, allow the API host to connect to Atlas, and set the frontend's `API_URL` to the deployed backend origin before building. Set backend `FRONTEND_URL` to the frontend's public URL. `/api/health` checks database connectivity.

Redis caching, spike detection and Docker packaging are not included. The UI layout follows [Mantis Free](https://codedthemes.com/item/mantis-free-figma-ui-kit/) with a custom dark palette.
