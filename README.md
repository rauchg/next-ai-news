## Next AI News

A full-stack replica of HN using Next.js and AI generated content.

### Design notes

- Uses [Next.js 14](https://nextjs.org/) with [App Router](https://nextjs.org/docs/app/building-your-application/routing) and [RSC](https://nextjs.org/docs/app/building-your-application/rendering/server-components) on the Node.js runtime
  - All pages are server-rendered and dynamic, with no data caching
  - All mutations are done via [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
  - [Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) is used throughout to maximize speed and concurrency
- Uses [pnpm](https://pnpm.io/installation) for package management
- Uses [Drizzle ORM](https://orm.drizzle.team/docs/overview) and Zod as the data layer
- Uses [Auth.js](https://authjs.dev/)'s [Next-Auth](https://next-auth.js.org/) for password authentication
- Used [v0](https://v0.dev) to generate all initial UIs with
  [Tailwind](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- Developed entirely and tested with the new Next.js `--turbo` Rust compiler
- Uses [react-highlight-words](https://bvaughn.github.io/react-highlight-words/) for search highlights
- [PPR](https://vercel.com/blog/partial-prerendering-with-next-js-creating-a-new-default-rendering-model) _(experimental)_ is used to precompute the shells of pages
  - When deployed, these are served statically from the edge
  - This makes TTFB faster and speeds up CSS/fonts while origin streams
- Deployed serverlessly on Vercel's Edge Network using:
  - [Cron Jobs](https://vercel.com/guides/how-to-setup-cron-jobs-on-vercel) for AI generation
  - [Serverless Functions](https://vercel.com/docs/functions/serverless-functions) (Node.js) for SSR (`iad1` / `us-east-1`)
  - [KV](https://vercel.com/docs/storage/vercel-kv) (Upstash) for rate-limiting (`iad1` / `us-east-1`)
  - [Postgres](https://vercel.com/docs/storage/vercel-postgres) (Neon) for core storage and search with [`pg_trgm`](https://www.postgresql.org/docs/current/pgtrgm.html) (`iad1` / `us-east-1`)

#### AI

- Uses [Mixtral](https://mistral.ai/) `mixtral-8x7b-32kseqlen` as the LLM for generated content
- Uses [Anyscale](https://www.anyscale.com/)'s finetune for [Tools support](https://www.anyscale.com/blog/anyscale-endpoints-json-mode-and-function-calling-features)
- Uses [openai-zod-functions](https://www.npmjs.com/package/openai-zod-functions) for structured and runtime-validated generation

### Deployment

- Make sure the Vercel project is connected to a Vercel Postgres (Neon) database
- Optionally, for rate limiting, add a Vercel KV (Upstash) database
- Run `pnpm drizzle-kit push:pg`
- Update `metadataBase` in `app/layout.tsx` to match your target domain

### Local dev

- Run `vc env pull` to get a `.env.local` file with your db credentials.
- Run `pnpm dev` to start developing
- For DB migrations with `drizzle-kit`:
  - Make sure `?sslmode=required` is added to the `POSTGRES_URL` env for dev
  - Run `pnpm drizzle-kit generate:pg` to generate migrations
  - Run `pnpm drizzle-kit push:pg` to apply them

### Performance

[PageSpeed report](https://pagespeed.web.dev/analysis/https-next-ai-news-vercel-app/x55es0m0ya?form_factor=mobile) for Emulated Moto G Power with Lighthouse 11.0.0, Slow 4G Throttling:

[![](https://h2rsi9anqnqbkvkf.public.blob.vercel-storage.com/perf-LAbwq5HsiimvbRrNSUV9JAGCATsBMs.png)](https://pagespeed.web.dev/analysis/https-next-ai-news-vercel-app/x55es0m0ya?form_factor=mobile)
<sup>&nbsp;&nbsp;&nbsp;💩 The SEO `98` score cannot be `100` without sacrificing stylistic fidelity to the original HN navigation</sup>

### Codebase notes

- Auth is initialized in `app/auth.tsx`, Drizzle in `app/db.tsx`.
- Shared components are in `./components` (exposed as `@/components`)
- Only one component was not reused from npm / shadcn ([`components/time-ago.tsx`](components/time-ago.tsx))
  - I couldn't find something very light that worked well with server-rendering (takes a `now` prop with a timestamp)
- The following db migrations were added manually:
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm;` as part of #13
  - `USING GIN (title gin_trgm_ops);` as part of #13

### TODO

This project is unique in that it's a full-stack replica of HN, with quite a few features. It'd be great
for the community to fill in some important gaps, however:

- [ ] Inline comment replies
- [ ] "Forgot password" flow
- [ ] Voting and ranking
- [ ] "Next" and "Prev" comment links
- [ ] Comment toggling
- [ ] Flagging submissions and comments
- [ ] Improve search further
- [ ] Comment pagination
- [ ] More efficient comment datastructures
- [ ] Optimistic comments with `useOptimistic`
- [ ] Local storage of comment and submission drafts
- [ ] Improve the `/next` implementationa after login
- [ ] Add support for passkeys
- [ ] A basic admin panel
- [ ] User profiles

### License

MIT
