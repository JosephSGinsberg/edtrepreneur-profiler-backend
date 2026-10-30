# Ignition Point — how it is deployed today

Written 30 Oct 2026. Documents the existing mechanism; nothing was rebuilt or overwritten.

## Facts
- **Not Git-backed.** No repository ever deployed these files. The live server copy is the only deployed copy.
- **Method used:** Hostinger API (Hostinger connector) file upload. A temporary upload URL for `josephginsberg.com` is generated (`hosting_files_generate-upload-url`), then each file is sent with the TUS protocol straight into `public_html`. Same effect as hPanel File Manager upload, scripted.
- **Not used:** SFTP, SSH, Git deploy, hPanel File Manager.
- **Hosting account / domain:** `josephginsberg.com` on Hostinger (WordPress site).

## Source of truth
| What | Authoritative editable source | Server destination |
|---|---|---|
| `module-save.php` | `ignition-point/spark-api/api/module-save.php` (this repo, matches live byte for byte at commit time) | `public_html/spark-api/api/module-save.php` |
| `cors.php` | `ignition-point/spark-api/lib/cors.php` | `public_html/spark-api/lib/cors.php` |
| `.htaccess` | `ignition-point/spark-api/.htaccess` | `public_html/spark-api/.htaccess` |
| `config.php` | **Server only. Never in Git.** Copy `config.example.php`, fill in Groundhogg token/public key | `public_html/spark-api/config.php` |
| `ip-profile.js`, `m1.html` to `m7.html` | `ignition-point/staging/` | `public_html/ip-staging-7k3q/` |

Caveat: `m1`-`m7.html` here are the hosted builds (each loads `ip-profile.js` via `<script data-module="N">`). Before this commit the only other copies were session working files, not a repo.

## Deploy a change (existing mechanism)
**Simplest (recommended for the Developer): hPanel File Manager.** hPanel > Websites > josephginsberg.com > File Manager > `public_html`. Open the destination folder from the table, upload the changed file, choose overwrite. Never upload or overwrite `config.php`.

**Scripted (what was used):** generate an upload URL via the Hostinger API/connector, then for each file:
1. `POST  <BASE>/tus/public_html/<path>?override=true` with `Upload-Length: <bytes>`, `Upload-Offset: 0`, `Tus-Resumable: 1.0.0`, `X-Auth`, `X-Auth-Rest` headers. Expect 201.
2. `PATCH <BASE>/tus/public_html/<path>?override=true`, `Content-Type: application/offset+octet-stream`, `Upload-Offset: 0`, file as body. Expect 204.
Upload keys expire after about 6 hours; regenerate the URL if you get 403.

**Do not use** Hostinger `hosting_deploy`: it deploys a Git repo as a static or Node site and overwrites the site contents.

## After deploying
- Syntax check PHP, then POST a test email to `/spark-api/api/module-save.php` and confirm the contact in Groundhogg; delete test contacts.
- Staging pages are unlisted and noindex; keep them unlinked from products.

## Payments
No PayFast change was made. PayFast stays in sandbox. Nothing here touches WooCommerce, checkout or delivery.
