# Commerce API Integration Layer

The app never talks to a commerce system directly. Every screen goes through one integration layer that owns authentication, caching, retries, error shape and contract versioning. Swapping BigCommerce for another storefront, or NAV for another ERP, changes one adapter — not a screen.

```
UI  →  repository  →  integration layer  →  adapter  →  external system
                          │
                          ├─ auth + token refresh
                          ├─ cache (memory → disk → stale-while-revalidate)
                          ├─ retry, backoff, idempotency
                          ├─ error taxonomy (typed, never raw HTTP)
                          └─ mapping (external DTO → app model)
```

| Concern | Rule |
|---|---|
| Auth | Server-issued tokens only. No storefront or ERP secret ever ships in the binary. |
| Contracts | Adapters map to app models. External field names stop at the adapter boundary. |
| Caching | Per-domain TTL, not one global cache. Cart and inventory are never served stale on checkout. |
| Errors | One taxonomy across all systems. Screens branch on error type, never on status code. |
| Writes | Idempotency keys on cart, order and refund calls. Retries must not double-charge. |
| Degradation | Read paths fail soft (cached, then empty state). Write paths fail loud (blocked, with a reason). |

---

## BigCommerce — catalog, cart, checkout

Storefront GraphQL for reads, REST for management, the Storefront Cart API for mutations, and hosted checkout or the Checkout SDK for payment. Physical goods may use external payment; digital goods must go through StoreKit 2 / Play Billing.

- **Catalog** — products, variants, options, categories, brand, images, metafields. Cache 10–15 min, keyed by locale and currency; purge on webhook.
- **Inventory** — available-to-promise per variant. Cache 60 s maximum. Never trust cached stock at the add-to-cart or place-order step; re-check before submit.
- **Cart** — create, add line item, update quantity, apply coupon, set shipping estimate. Server-side cart ID persisted across launches and reinstalls where possible.
- **Checkout** — address validation, shipping option selection, tax, order submit, order status polling. Hosted checkout is the default; a native checkout only where the storefront supports it end to end.
- **Account** — customer profile, addresses, order history, reorder. Guest checkout must not be blocked by a forced login.
- **Webhooks** — order created/updated, product updated, inventory changed, cart abandoned. Webhook is the cache invalidation signal, not the source of truth.

**Failure modes:** out-of-stock at submit, price changed between cart and checkout, coupon rejected, address not serviceable, payment declined, order created but confirmation lost. Every one needs a defined screen state, not a generic toast.

## NAV / LS Retail — ERP and inventory

The system of record for stock, cost, pricing, customers, orders and stores. Treat it as slow and authoritative: cache aggressively by domain, degrade gracefully, and never put it on a hot UI path without a fallback.

- **Inventory** — item availability by location, ATP, incoming stock, reservations. 60 s cache, longer for warehouse-only data.
- **Pricing** — base price, customer-specific price, promotions, tax groups. Price shown at checkout is confirmed by the server; the client never computes a final total.
- **Orders** — order export and status, fulfilment state, backorder and partial-shipment state, returns and credit notes.
- **Customers** — loyalty balance, account standing, outstanding credit where the app surfaces it.
- **Stores** — location list, trading hours, services, click-and-collect capability per store.

**Failure modes:** ERP latency spikes, scheduled maintenance windows, item master drift versus storefront catalog, partial writes, duplicate order submission. Sync is eventually consistent, so the app must show "confirmed" only after the order ID returns, and reconcile duplicates by idempotency key.

## Delivery Services — shipping integrations

Carrier and fulfilment APIs behind one shipping adapter: rate quoting, service levels, labels, tracking, and delivery windows.

- **Quoting** — postcode and cart based rates, free-shipping thresholds, oversized and restricted items, split shipments.
- **Fulfilment options** — standard, express, click-and-collect, same-day where a provider supports it. Show the promise date, not just a service name.
- **Tracking** — tracking number, carrier, milestone events, exception states. Cache tracking 5 min; poll only while a tracking screen is open.
- **Address and coverage** — serviceability check at address entry, not at payment.
- **Returns** — return eligibility, label generation, drop-off locations.

**Failure modes:** carrier timeout during quoting (fall back to a cached rate card, never to a free rate), tracking provider outage (show last known milestone with a timestamp), service removed after selection.

## Analytics & SEO — tracking and reporting

One analytics facade in front of every SDK. The app emits named events; the facade owns consent, batching, retry and vendor fan-out.

- **Events** — `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search`, `select_promotion`, with a fixed schema and no PII in properties.
- **Consent** — nothing fires before consent where consent is required; ATT prompt on iOS precedes IDFA-linked tracking; analytics stays functional without ad consent.
- **Attribution** — deep links, campaign parameters, and deferred deep links resolved once and persisted.
- **Crash and performance** — startup time, screen render, API latency and error rate per adapter, tied to release version.
- **SEO surface** — universal/app links, shareable product and category URLs, structured metadata on any web-rendered page, canonical handling for app-opened links.

**Failure modes:** vendor SDK blocks startup (init off the main thread, with a timeout), duplicate purchase events after a retry, split sessions from a broken deep link, consent state lost on reinstall.

---

## Also in the layer

| Layer | Covers | Cache | Hard rule |
|---|---|---|---|
| **Identity & accounts** | Sign in, register, guest, session refresh, biometric unlock, delete account | Session in secure storage, no TTL on refresh token | Account deletion must be in-app, end to end, on both stores |
| **Payments** | Tokenisation, wallets, 3-D Secure / SCA, refunds, saved cards | Never cache PAN or CVV; tokenise at the gateway | No card data on device, no client-side amount calculation |
| **Content & merchandising** | CMS pages, banners, category copy, app config, feature flags | 15 min, purge on publish | Content must not gate a working purchase path |
| **Search & recommendations** | Query, facets, suggestions, related items | 5 min per query, longer per product | Empty results are a designed state, not a blank screen |
| **Promotions & loyalty** | Coupons, member pricing, points, tiers | 5 min, revalidate at checkout | Discount math is server-side only |
| **Notifications** | Push, email, SMS, deep-link routing | Device token registry, refreshed per launch | Every push has a destination that survives a cold start |
| **Reviews & UGC** | Ratings, reviews, photos, Q&A | 15 min | Reporting and blocking controls always visible |
| **Support** | Chat, FAQ, contact, order help | None | Support entry point reachable from every order state |
| **Observability** | Structured logs, trace IDs, adapter latency, alerting | Local buffer, batched upload | One trace ID spans a tap to the ERP call |

## Error taxonomy

Adapters translate every failure into exactly one type. Screens own the copy.

| Type | Cause | UI behaviour | Retry |
|---|---|---|---|
| `offline` | No connectivity | Cached data + offline banner | Auto on reconnect |
| `timeout` | Adapter exceeded budget | Inline retry affordance | Yes, with backoff |
| `unauthorized` | Expired or revoked token | Silent refresh, then re-auth sheet | Once |
| `forbidden` | Entitlement or region block | Explain, offer alternative | No |
| `notFound` | Removed product, expired cart | Recover to nearest valid screen | No |
| `conflict` | Price or stock changed | Show the change, ask to confirm | No |
| `validation` | Address, coupon, quantity | Field-level message | After fix |
| `rateLimited` | Quota or burst | Queue and retry | Yes, honour `Retry-After` |
| `server` | 5xx or malformed payload | Fail soft on reads, block on writes | Yes, bounded |
| `paymentDeclined` | Issuer or risk | Reason where the gateway gives one | With another method |

## Non-negotiables

1. **One adapter per system**, one contract test per adapter, fixtures committed so CI runs without live credentials.
2. **Timeouts:** 5 s reads, 10 s writes, 15 s payment. Past the budget, fail with a type — never hang a screen.
3. **No secret in the app.** Tokens come from the backend, scoped, short-lived, revocable.
4. **Server is the source of truth** for price, tax, stock, shipping cost and total. The client renders, it does not decide.
5. **Every write is idempotent.** Cart, order, refund, address — all keyed.
6. **Version the contract**, not the endpoint. Additive changes ship without an app release; breaking changes get a new version and a deprecation window.
7. **Degrade in this order:** fresh cache → stale cache with timestamp → empty state with retry. Never a spinner that never resolves.
8. **Instrument every adapter** with latency, error rate and cache hit rate before launch, not after the first incident.
