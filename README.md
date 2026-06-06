# Pasampo

Pasampo is a prototype for a Zambian verified marketplace where users can browse goods, sign up with Firebase, create listings, verify identity, choose delivery options, and test checkout flows for Airtel Money, MTN Money, and Stripe.

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
- Airtel Money, MTN Money, and Stripe checkout options
- Lusaka map and inbox available after sign-in
- Static HTML prototype ready for GitHub Pages

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
