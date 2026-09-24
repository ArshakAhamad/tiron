# Northwind Studio: Case Studies

A content-driven Case Studies feature for a fictional agency site, built on **Next.js 15 (App Router)**, **Payload CMS 3**, **MongoDB** and **Tailwind CSS 4**.

- Payload collection `case-studies` with drafts/publish workflow, seeded from `seed/seed.csv`
- Index page with server-side filtering (industry, service, text search) and page-number pagination
- Detail page with ISR, per-page metadata, generated OG image and JSON-LD
- A direct MongoDB **aggregation** (`$facet`) for filter counts, the "query MongoDB directly where the local API isn't enough" case
- Loading, error and not-found states; tests for the aggregation and key components

## Run it

Requires Node 20.9+ and a MongoDB instance.

```bash
cp .env.example .env            # already contains working local defaults
docker compose up -d            # MongoDB on :27017 (or point DATABASE_URI at Atlas / your own)
npm install
npm run seed                    # upserts the 14 case studies from seed/seed.csv (idempotent)
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

The first visit to `/admin` prompts you to create an admin user. Other commands:

| Command | What it does |
| --- | --- |
| `npm run seed:reset` | Delete all case studies, then re-seed |
| `npm test` | Vitest: aggregation pipeline + component tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run generate:types` / `generate:importmap` | Re-run after changing collections or editor features (outputs are committed) |
| `npm run build && npm start` | Production build. **`DATABASE_URI` must be reachable at build time** so ISR can pre-render pages |

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

## Trade-offs and what I'd do next

- **Text search** uses case-insensitive regex over title/client/summary. That's fine at this size; at scale I'd use a MongoDB text index or Atlas Search.
- **Indexes**: single-field indexes are set on the filterable fields. For a large collection I'd add a compound index on `(_status, industry, publishedAt)`.
- **Media** is stored on local disk (`/media`). On serverless hosting, swap in a Payload storage adapter (S3 / Vercel Blob) and add its hostname to `images.remotePatterns`.
- **Next 15 pinned** (`15.4.x`) to match Payload 3's peer range. `unstable_cache` is used deliberately for this version; on Next 16 I'd move to `"use cache"` + `cacheTag`.
- **Unknown URLs** outside `/case-studies` and `/admin` show Next's default 404, because the two route groups have separate root layouts. A `global-not-found` would brand it.
- Not included: Playwright end-to-end tests, and visual regression.
