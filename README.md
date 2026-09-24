# Northwind Studio: Case Studies

A content-driven Case Studies feature for a fictional agency site, built on **Next.js 15 (App Router)**, **Payload CMS 3**, **MongoDB** and **Tailwind CSS 4**.

- Payload collection `case-studies` with drafts/publish workflow, seeded from `seed/seed.csv`
- Index page with server-side filtering (industry, service, text search) and page-number pagination
- Detail page with ISR, per-page metadata, generated OG image and JSON-LD
- A direct MongoDB **aggregation** (`$facet`) for filter counts, the "query MongoDB directly where the local API isn't enough" case
- Loading, error and not-found states; tests for the aggregation and key components

## Setup

Requires **Node 20.9+** and **MongoDB** (local or Atlas).

```bash
git clone <this-repo> && cd <this-repo>
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/tiron-case-studies` |
| `PAYLOAD_SECRET` | Signs Payload auth tokens. Any long random string | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL for canonical links, sitemap and OG tags | `http://localhost:3000` |

'DB name I choose as - tiron-case-studies if you want other you can change'

**Database options**
- **Local:** Install MongoDB Community and use the local URI above, or run `docker compose up -d` to start MongoDB 7 on port `27017`.
- **Atlas:** use the `mongodb+srv://…` string, with the database name before the `?` (`…mongodb.net/tiron-case-studies?retryWrites=true&w=majority`). Add your IP under Network Access.

Then seed and run:

```bash
npm run seed     # upserts 14 case studies from seed/seed.csv (idempotent; `npm run seed:reset` wipes first)
npm run dev      # http://localhost:3000 · admin: /admin (first visit creates the admin user)
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Vitest: aggregation pipeline + component tests (20 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run generate:types` / `generate:importmap` | Re-run after changing collections or editor features (outputs are committed) |
| `npm run build && npm start` | Production build. **`DATABASE_URI` must be reachable at build time** so ISR can pre-render pages |

**Troubleshooting**
- `missing secret key`: `.env` doesn't exist or lacks `PAYLOAD_SECRET` (`.env.example` is only a template).
- `AtlasError … Failure getting dbStats … context deadline exceeded` while seeding against a free **M0** cluster is a server-side quota-check timeout inside Atlas, not an app bug. I hit it during development and used local MongoDB instead. Retrying, a different region, or a paid tier resolves it.

## Structure

```
seed/seed.csv                        14 fictional case studies
scripts/seed.ts                      CSV → Payload (validates enums, converts text → Lexical rich text)
src/collections/CaseStudies.ts       the collection + revalidation hooks
src/lib/case-studies.ts              cached Local API reads (list, detail, featured, related)
src/lib/aggregations.ts              $facet pipeline (pure builder + runner on the Mongoose model)
src/lib/filters.ts                   URL ↔ filters parsing, href building, page window
src/app/(site)/…                     public site (home, /case-studies, /case-studies/[slug], OG image)
src/app/(payload)/…                  Payload admin + REST (standard Payload 3 layout)
src/components/…                     Card, Filters, Pagination, CoverArt, JsonLd, Header, Footer
```

## Content model

`case-studies` fields: `title`, `slug` (unique, auto-generated), `client`, `industry` (select), `services` (multi-select), `summary`, `coverImage` (optional upload), `year`, `duration`, `projectUrl`, `featured`, `publishedAt`, `results[]` (metric + label), `content` (Lexical rich text), `testimonial` (group), `technologies[]`, `seo` overrides.

**Seed format.** `seed.csv` uses pipe-separated lists for `services` and `technologies`, `metric:label` pairs for `results`, and plain text for `content` (`\n\n` between blocks, `## ` for H2, `- ` lines for bullets). The seed script is an upsert by slug, so re-running it is safe. Industry and service values are validated against the same constants the collection uses, so a typo fails loudly.

## Decisions (the deliberately open bits)

**Pagination: numbered pages in the URL (`?page=2`), 6 per page.**
Chosen over infinite scroll / "load more" because it's shareable, back-button safe, crawlable, works without JS and keeps the footer reachable. The page size of 6 gives a clean 2-column grid at every breakpoint. Page numbers are compact (`1 … 5 6 7 … 12`), and an out-of-range `?page=99` redirects to the last real page instead of showing an empty screen. At very large scale I'd move to cursor pagination, but for a marketing site's few dozen entries page numbers are the better UX.

**Filtering: server-rendered, URL-driven, no client state.**
Industry and service chips are plain links and search is a GET form, so filtering works without JS, every state is a shareable URL, and the server does all the work. Changing a filter resets to page 1. Filter values are validated against an allow-list before they reach the database.

**Ordering and "featured".**
The list is always newest first (`publishedAt` desc). `featured` is a curation flag that drives the home page's "Selected work" only; it deliberately does *not* affect list order, so editors can't accidentally make pagination unpredictable. On the first unfiltered page, the newest project is shown as a larger lead card.

**Empty states.** There are two, because they mean different things. If filters produce no results, the page says so and offers "Clear filters". If the collection is genuinely empty (nothing published yet), it says case studies are on the way and offers a contact link. The filter chips only list options that exist in the data, so an empty industry can't be selected in the first place.

**Aggregation (MongoDB directly).**
The filter chips show live counts. That's a cross-cutting aggregation the Local API can't express, so `src/lib/aggregations.ts` runs a single `$facet` pipeline on the underlying Mongoose model: industries, services (after `$unwind` on the array field) and the total. Counts follow standard faceted-search rules: each facet ignores its *own* selected value but respects the others, so you see what switching would give you. The pipeline builder is a pure function and is unit-tested without a database. The home page reuses the same aggregation for its "N projects across M industries" line.

**Caching / revalidation (ISR + on-demand).**
- Payload's Local API doesn't use `fetch`, so Next's data cache can't see it. Reads are wrapped in `unstable_cache` and tagged `case-studies`.
- Collection `afterChange` / `afterDelete` hooks call `revalidateTag` and `revalidatePath`, so publishing in the admin updates the site within seconds.
- `revalidate = 3600` on pages and cached reads is the safety net for anything that bypasses the hooks (direct DB edits, a failed hook).
- The detail page pre-renders known slugs (`generateStaticParams`) and renders new ones on first request (`dynamicParams`).
- The index page depends on `searchParams`, so it renders per request, but its data comes from the tagged cache, so it's still cheap.
- Draft content never leaks: the Local API bypasses access control by default, so every public query explicitly filters `_status = published`.

**Cover images.** `coverImage` is optional. Without one, the site renders a generated cover from a curated set of duotone palettes, keyed by slug, so cards always look intentional and the seed data needs no binary assets. Uploaded images use `next/image` and the `card` size.

## SEO

- `generateMetadata` on the detail page: title/description (with `seo` overrides), canonical, Open Graph `article` data, Twitter card
- Per-case-study generated **OG image** (`opengraph-image.tsx`)
- **JSON-LD**: `Article` on detail pages, `CollectionPage` + `ItemList` on the index
- Index metadata: paginated pages are indexable with self-canonical URLs; filter/search combinations are `noindex, follow` with canonical to `/case-studies` (near-infinite thin variants otherwise)
- `sitemap.xml` (includes every published case study with `lastModified`) and `robots.txt` (blocks `/admin`, `/api`)
- Semantic structure: one `h1` per page, breadcrumbs, `<article>`, `<time>`, `<dl>` for facts

## Design

Direction: cool off-white, near-black ink and a single cobalt accent. Headlines are set in Bricolage Grotesque (slightly condensed, tight tracking) with Geist for body text; both are self-hosted, so there are no network font requests. Cards are borderless (image + text, no boxes), the newest project leads as a larger card, and the one loud moment is the cobalt "What changed" results band on the detail page, since results are what a prospective client is scanning for. Layout is mobile-first: single column → two columns at `md`, the filter chips scroll horizontally on phones and wrap on larger screens, and the detail sidebar becomes sticky at `lg`.

## Accessibility

Skip link; landmarks (`header`, `nav` with labels, `main`, `footer`); visible focus ring; every filter and pager control is a real link with `aria-current`; the search input has a label; result counts announce via `aria-live`; card links use a stretched-link pattern so the accessible name is just the title; external links announce that they open a new tab; decorative generated covers are `aria-hidden` and uploaded images require alt text in the admin; `prefers-reduced-motion` respected; loading skeletons use `role="status"`, and errors use `role="alert"`.

## Tests

`npm test` (20 tests, Vitest):
- **Aggregation**: `$match` always restricts to published; facet exclusion logic; `$unwind` before grouping; regex escaping of user search text; empty-collection handling (`$count` emits no row)
- **Filters**: URL parsing/clamping, href building, page window
- **Components** (server-rendered): pagination semantics (`aria-current`, `rel=prev/next`, disabled state), card link/name, filter chips and labelled search

## Known trade-offs

- **Text search** uses case-insensitive regex over title/client/summary. Fine at this size; it doesn't scale.
- **Indexes** are single-field on the filterable fields. There is no compound index yet.
- **Media** is stored on local disk (`/media`). Serverless hosting needs a storage adapter.
- **Next 15 is pinned** (`15.4.x`) to match Payload 3's peer range, so `unstable_cache` is used deliberately.
- **Unknown URLs** outside `/case-studies` and `/admin` show Next's default 404, because the two route groups have separate root layouts.
- **Verification:** unit and component tests, type-checking and the compile step were run in CI-style conditions. The full app was exercised against a local MongoDB by hand.

## What I'd do differently with more time

1. **End-to-end tests (Playwright):** filter → paginate → open detail → back, plus the empty and not-found states. The unit tests cover the logic; nothing yet covers the flow in a real browser.
2. **Accessibility and performance audit:** run axe and Lighthouse on all three page types, and add a visual-regression check at mobile, tablet and desktop widths. I designed for these but haven't measured.
3. **Real imagery:** upload covers through the Media collection and use them for OG images too. Today the OG image is a generated title card and covers fall back to generated art.
4. **Search:** replace regex with a MongoDB text index or Atlas Search (ranking, typo tolerance), and add a compound index on `(_status, industry, publishedAt)` once the collection grows.
5. **Editor experience:** Payload Live Preview and draft preview URLs, so editors can see a case study on the real page layout before publishing, and richer content blocks (image, quote, stat) instead of one rich-text field.
6. **Smarter "related work":** rank by overlapping services with a second aggregation, not just same industry.
7. **CI and delivery:** a GitHub Actions workflow running typecheck, tests and build against a service-container MongoDB on every push, plus a preview deployment.
8. **Framework upgrade path:** move to Next 16 and `"use cache"` / `cacheTag` once Payload supports it, replacing `unstable_cache`.
9. **Observability:** wire the error boundary into an error reporter, and add basic analytics events for filter and search usage.
10. **Filter UX:** on mobile, collapse the two chip rows into a single "Filters" sheet with an applied-count badge; on desktop, keep them inline.

                                                                     ## THANK YOU
