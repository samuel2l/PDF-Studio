# PDF Studio

Free, private PDF tools that run entirely in the browser. No uploads, no accounts, no paywalls.

## Features

- Compress, merge, split, organize, extract, and rotate PDFs
- Images ↔ PDF conversion
- Watermarks and page numbers
- Choose where files save (Downloads, Desktop, or a folder on your computer)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy (free static hosting)

The app is a static site. Build with `npm run build` — output goes to `dist/`.

### Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Vercel auto-detects Vite — click Deploy

Or with the CLI:

```bash
npm i -g vercel
vercel
```

### Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

Or drag-and-drop the `dist/` folder at [app.netlify.com/drop](https://app.netlify.com/drop)

### Cloudflare Pages

1. Push to GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Build command: `npm run build`
4. Build output directory: `dist`

## Privacy

All PDF processing happens in the user's browser using WebAssembly and JavaScript. Files are never sent to a server. When users export, files are saved directly to their computer using the browser's save dialog or File System Access API.

## Browser support

Best experience in Chrome, Edge, or Arc (save location picker + folder access). Firefox and Safari fall back to the browser's default Downloads folder.
