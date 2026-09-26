# Album of the Day

English-language static site: one album from Rolling Stone's current 500 Greatest Albums of All Time is selected each day.

## No Node.js required

This repository is designed to be published directly with GitHub Pages.

GitHub Actions:
1. fetches the current Rolling Stone ranking;
2. creates `data/albums.json`;
3. deploys the site to GitHub Pages.

## Publish from an iPhone

1. Create a new repository on GitHub named `album-of-the-day`.
2. Upload all files from this folder, preserving `.github/workflows/build-and-deploy.yml`.
3. Open **Actions** and run **Build and deploy Album of the Day** if it has not already run.
4. Open **Settings → Pages** and select GitHub Actions if GitHub asks for a source.
5. Your site will be available at:
   `https://YOUR-USERNAME.github.io/album-of-the-day/`

## Data

The workflow fetches the 2026 Rolling Stone ranking directly from the published article and refuses to deploy an obviously incomplete dataset.

Wikipedia information is requested live from the English Wikipedia REST API when an album is displayed. The project stores links/metadata rather than copying Wikipedia articles.

Album artwork is requested live from Wikimedia Commons where available.
