# KG Studio

KG Studio is the browser-based creator tool for Kyntric Games.

## Deploy on GitHub Pages (Chromebook-friendly)

1. Create a public repository named `KG-Studio`.
2. Upload the extracted project files and folders to the repository root.
3. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The included workflow builds Vite and deploys the `dist` folder.
5. In **Settings → Pages → Custom domain**, enter `kg-studio.dev.li`.

Add the DNS CNAME record for `kg-studio` pointing to `Kyntric-GIT.github.io` (or the GitHub Pages target shown by your DNS provider). DNS may take time to propagate.

This is an early UI prototype. Saving is currently a local UI action only; cloud project storage and real 3D editing will be added later.
