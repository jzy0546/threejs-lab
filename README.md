# Three.js Lab legacy migration shell

This repository no longer publishes the maintained tools or guides. It builds
`noindex,follow` migration pages from `threejs.vavist.com` to the corresponding
pages on `https://vavist.com`.

## Commands

```bash
npm ci
npm run build
npm run check
```

## Publishing order

Do not deploy this shell before the main-domain migration is live.

1. Deploy `vavist.com`.
2. Confirm all five `/tools/` targets and the maintained guide/policy targets return HTTP 200.
3. Run this repository's build and check.
4. Manually dispatch the legacy GitHub Pages workflow.

GitHub Pages cannot return a configurable HTTP 301 here. Each shell therefore
uses a visible link, a five-second meta refresh, JavaScript `location.replace`,
a new-domain canonical, and `noindex,follow`. Query parameters and fragments are
preserved by the JavaScript redirect.
