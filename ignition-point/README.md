# Ignition Point — module profile save (handoff to Developer)

Snapshot of the **live staging build** as of 30 Oct 2026, copied unchanged from josephginsberg.com. Nothing else in this repository was modified. Nothing here touches WooCommerce, PayFast (sandbox stays enabled) or product delivery.

Note: the rest of this repo is a Node/Mongo app. These files are PHP and static HTML that run on the Hostinger WordPress site, so they sit in this folder only to be versioned. Move the folder if you keep them elsewhere.

## Layout and where it runs

| Here | Live location |
|---|---|
| `spark-api/api/module-save.php` | `public_html/spark-api/api/module-save.php` |
| `spark-api/lib/cors.php` | `public_html/spark-api/lib/cors.php` |
| `spark-api/config.example.php` | example for `public_html/spark-api/config.php` (real file exists only on the server, never committed) |
| `spark-api/.htaccess` | blocks direct access to `config.php` and `*.example.php` |
| `staging/ip-profile.js`, `staging/m1.html` to `m7.html` | `public_html/ip-staging-7k3q/` (unlisted, noindex) |

Not included: `profile-save.php` (Spark's own endpoint, separate concern) and the real `config.php`.

## What exists (IMPLEMENTED)

**Endpoint.** `POST /spark-api/api/module-save.php`, JSON body:
`{ email, module (1-7), tally{diagram,passage,clip,puzzle,thread}, answers{...}, lean }`.
It looks the contact up in Groundhogg (v4 REST, `gh-token` and `gh-public-key` headers, `?search=<email>`, exact email match), creates it if absent, writes per-module meta (`ip_m{n}_*`), recomputes the cumulative profile (`ip_profile_*`, `ip_modules_done`), and swaps stale `ip_door_*` and `ip_lean_*` tags using `remove_tags`. Re-saving a module overwrites that module's values. Returns `{ok, saved, mode, profile, ...}`.

**CORS / config helper.** `lib/cors.php` loads `config.php`, sends `Access-Control-Allow-Origin` only for origins listed in `allowed_origins`, and parses the JSON body. **There is no authentication helper.** CORS only restricts browsers; curl is unaffected.

**Save hooks (client).** `ip-profile.js` is included by each page with `data-module="N"`.
- `window.ipSave({tally, answers})` is called by M1, M2, M3, M5 and M7 on the reveal screen. If email and the consent tick are present it sends; otherwise it holds the snapshot and prompts.
- `window.ipMountButton(host, getSnap)` adds a "Save my progress" button on M4 and M6, which have no reveal screen. M6 and M7 are unchanged apart from these hooks.
- Email comes from `?e=` or `localStorage.ip_email`; consent from `localStorage.ip_consent`. Both are browser-side only.
- Off `josephginsberg.com` the bar shows "Preview mode" and nothing is sent.

**Answer blob shapes** (`ip_m{n}_answers`, capped at 8,000 characters): M1 `{q1..q4, blank1..3}`; M2 `{core, evidence[]}`; M3 `{core, hypotheses[]}`; M4 `{ideas[], selected}`; M5 `{core, scope, offer}`; M6 `{tracker[], days[], review{}}`; M7 `{core, commit}`.

## Not implemented (Developer scope, per Zeph)

1. **Purchase-linked access.** The pages are open to anyone with the URL.
2. **Server-side ownership checks.** The endpoint trusts the `email` in the request body, so anyone who knows an email can overwrite that contact's data or tags. This is the main launch blocker. A signed, purchase-linked token (verified server-side before any read or write) would close it.
3. **Resume / restore.** There is no restore hook. Module state lives in each page's closure (`state`). Saved data is the tally and the answers blob only. Per-question door picks (`openDoor`), puzzle order and the current step are not saved, so a faithful resume needs those added to the payload plus a read endpoint and a hydrate step in each module.
4. **Server-side consent record.** Consent is browser-side only.
5. **Paid delivery** is not changed. The staging pages are not linked from any product. Delivery stays blocked/unchanged until gateway verification, and PayFast remains in sandbox.
6. Cleanup before launch: the "Build QA, raw signal" panel on the reveal screens is still present.

## Verified 30 Oct 2026
Create, update, cumulative roll-up and stale-tag removal tested against the live Groundhogg; all 7 pages saved from the live site in a real browser; tap-to-swap and drag both solve the puzzle. Test contacts were deleted afterwards.
