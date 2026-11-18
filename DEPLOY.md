# Publishing on GitHub Pages at portfolio.divyanshiverma.com

The site is plain HTML, CSS and JS. Nothing needs building at serve time.
(`tools/build.mjs` regenerates the HTML from `assets/shots/*/notes.json` and
`assets/behance/behance.json` if you edit copy there: `node tools/build.mjs`.)

## 1. Create the repo and push

```sh
cd /Users/Div/portfolio-divyanshiverma
git init -b main
git add .
git commit -m "Portfolio site"
gh repo create divyanshiverma/portfolio --public --source . --push
```

The folder already contains `CNAME` (one line: `portfolio.divyanshiverma.com`)
and an empty `.nojekyll`, so Pages serves the files as they are.

## 2. Turn on Pages

GitHub, repo `divyanshiverma/portfolio`, Settings, Pages:

- Source: Deploy from a branch
- Branch: `main`, folder `/ (root)`, Save
- Custom domain: `portfolio.divyanshiverma.com` (already filled in from the CNAME file), Save

Or from the terminal:

```sh
gh api -X POST repos/divyanshiverma/portfolio/pages -f "source[branch]=main" -f "source[path]=/"
gh api -X PUT repos/divyanshiverma/portfolio/pages -f cname=portfolio.divyanshiverma.com
```

## 3. Add the DNS record

At the DNS provider for divyanshiverma.com, add one record:

| Type  | Name / Host | Value                     | TTL  |
|-------|-------------|---------------------------|------|
| CNAME | portfolio   | divyanshiverma.github.io. | 3600 |

Leave the existing records for the main site (the apex A records and `www`) alone.

Check it with `dig +short portfolio.divyanshiverma.com`; it should return
`divyanshiverma.github.io.` and then GitHub's IPs.

## 4. HTTPS

Once GitHub shows the DNS check as passed (usually minutes, up to an hour),
tick **Enforce HTTPS** in Settings, Pages.

## Preview locally

```sh
cd /Users/Div/portfolio-divyanshiverma && python3 -m http.server 8000
```

Then open http://localhost:8000.
