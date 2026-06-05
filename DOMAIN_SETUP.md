# Custom Domain Setup

GitHub Pages can host Pasampo on a custom domain once you own the domain.

## Recommended Domains

- `pasampo.com`
- `pasampo.co`
- `pasampo.co.zm`
- `pasampo.zm`

## GitHub Pages Steps

1. Create a GitHub repository, for example `pasampo`.
2. Push this folder to GitHub.
3. Go to repository `Settings`.
4. Open `Pages`.
5. Set source to `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save.
8. Add your custom domain in the GitHub Pages custom domain field.

## DNS Steps

At your domain provider, create these DNS records for an apex domain:

```txt
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

For a `www` subdomain:

```txt
CNAME www   YOUR-GITHUB-USERNAME.github.io
```

Replace `YOUR-GITHUB-USERNAME` with your GitHub username.

## CNAME File

Once you choose the exact domain, create a file called `CNAME` in the repository root containing only the domain:

```txt
pasampo.com
```

Do not include `https://`.
