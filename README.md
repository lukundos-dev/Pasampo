# Pasampo

Pasampo is a Zambian marketplace prototype with Firebase sign-in, account-specific listing and messaging tools, and a simulated Lenco checkout. Identity document review and real payments still require a backend.

## Prototype

Live GitHub Pages URL:

```txt
https://lukundos-dev.github.io/Pasampo/
```

Open the site locally with:

```bash
python3 -m http.server 8765
```

Then visit:

```txt
http://localhost:8765/
```

## Current Features

- Firebase email/password and Google sign-in
- Buyer browsing and product detail pages
- Seller activation flow and seller-only store dashboard
- NRC/passport verification prototype
- Simulated checkout awaiting Lenco integration
- Account-specific cart, listings, store settings, orders and inbox
- Firebase session changes clear private screens and drafts
- Static HTML prototype ready for GitHub Pages

## Account Handling

`assets/account-session.js` holds the active Firebase session in memory. A saved browser profile cannot sign someone in. Private prototype data is cached under the Firebase UID. Old shared caches are left untouched and are not imported because their owner cannot be confirmed.

Browser caches are not a permission system or a shared database. Real identity approval, review totals and administrative roles must be verified by a backend. Current accounts cannot award themselves ID approval or a Verified badge. Public sample listings retain illustrative trust data; they are not real approved sellers. Document submission is still a demonstration and must not be used to collect real identity documents.

Run the account regression checks with Node.js:

```bash
node --test tests/account-session.test.cjs
```

Firebase provider configuration, authorized domains and email delivery require live account testing separately.

## Deployment

This project is currently a static website. GitHub Pages can serve it from the repository root using `index.html`.

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

To publish updates:

```bash
git add .
git commit -m "Update Pasampo prototype"
git push
```

For a custom domain, add a `CNAME` file containing the domain name, then configure DNS with your domain provider.
