# Miimerica

A Wii Menu recreation for the $MIIMERICA token. Boot screen, channel grid,
hover previews, Wii Mail, and a contract-address bar.

Plain HTML/CSS/JS. No build step, no framework, no runtime dependencies,
no third-party scripts, no analytics, no network calls of any kind.

**A note on the name.** The project was renamed from Wiimerica to Miimerica —
every title, heading and piece of copy in this repo says Miimerica. Three
things deliberately still say Wiimerica:
- the domain, **wiimerica.fun**, and the X account, **@wiimerica_fun**
  (external accounts, not something this repo controls — update the URLs here
  once you've moved them)
- the boot-screen logo and the social share card, which have "Wiimerica"
  drawn into the artwork as pixels, not text — swap in new art and regenerate
  with `npm run share` when you have it
- filenames on disk (`public/wiimerica/`, `wiimerica logo.png`, `wiimerica
  PROMO 1.mp4`) — renaming these is safe to do later, but every reference to
  them in `channels.js` would need to move in the same commit

---

## Run it

```bash
npm run dev
```

Then open <http://localhost:5173>.

Any static host works — it is just files. There is nothing to compile.

### Deploying (read this before changing the layout)

`vercel.json` pins the output directory to the repo root, and the local dev
server lives in `tools/`, not at the root. Both are deliberate:

- Vercel treats a root-level Node entrypoint plus a `start` script as "this is
  a Node app" and deploys the site as a serverless function. Every static asset
  then 404s, because those files are not bundled into the function.
- Vercel also treats a root folder named `public/` as the output directory and
  publishes its *contents* at the site root, so `public/thumbs/x.jpg` would be
  served as `/thumbs/x.jpg` while `assets/` never deploys at all.

The site rendered as unstyled HTML on the live domain for both reasons. Do not
add a `start` or `build` script to `package.json`, and do not move the dev
server back to the root.

One more trap: **`vercel.json` allows no comment keys.** Adding a `"//"` field
fails schema validation, and every deploy is then rejected while the last good
build stays live — so the site looks unchanged and nothing obviously errors.
Keep that file to documented properties only.

---

## Before launch — the two things you must do

### 1. Paste the contract address

Open [`assets/js/channels.js`](assets/js/channels.js) and fill in the top block:

```js
contractAddress: "YourContractAddressHere",

links: {
  buy:     "https://...",   // pump.fun / Raydium / Uniswap
  chart:   "https://...",   // DexScreener
  twitter: "https://x.com/wiimerica_fun"
}
```

While `contractAddress` is empty the top bar stays hidden and the Buy channel
reads "COMING SOON". The moment you fill it in, the address bar appears with a
copy button and the Buy channel goes live. Empty links simply hide their buttons.

### 2. Set the real site URL for link previews

In [`index.html`](index.html), the `og:image` / `twitter:image` tags are
relative paths. Most social platforms require absolute URLs, so once you know
the domain, change them to the full `https://yourdomain.com/public/thumbs/...`
form. Everything else in the page works as-is.

---

## Editing channels

Everything on the menu comes from the `channels` array in
[`assets/js/channels.js`](assets/js/channels.js). Twelve channels fill a page,
exactly like the real console; add more and a second page with arrows appears
automatically.

```js
{
  title:  "Cookout Channel",       // label that slides up on hover
  poster: "some-image.png",        // still shown on the tile
  video:  "some-clip.mp4",         // plays on hover, full screen when opened
  audio:  "soundtrack.aac",        // optional — see below
  body:   "One line of caption."   // text under the video on the channel page
}
```

- `type: "buy"` renders the token panel instead of a video.
- Omit `poster` and the video's first frame is used as the tile art.
- Files are read from `public/wiimerica/`. Spaces and unicode in filenames are
  fine — paths are encoded at runtime.

### `video` + `audio` on the same channel

Give a channel both and the clip becomes a silent looping backdrop while the
audio track plays through as the real content. Channel 1 uses this: the promo's
full cut in this folder is a 42-second **audio-only** export, and
`wiimerica.mp4` is only 6 seconds, so the clip loops behind the full promo.

**If you have a real full-length promo video**, drop it in `public/wiimerica/`,
put the filename in channel 1's `video:` and delete its `audio:` line. That is
the whole change.

**After adding or replacing any image, run `npm run thumbs`.**

---

## Why there is a thumbnail step

The source art is 23 MB of full-resolution PNGs. The channel tiles render at
about 380px wide, so shipping the originals meant a ~25 MB first load.

`npm run thumbs` writes 720px JPEG copies into `public/thumbs/` (0.9 MB total).
Tiles load those; opening a channel still uses the full-size original from
`public/wiimerica/`. Images that genuinely use transparency also get a PNG copy,
because the boot-screen logo sits on black and a white-flattened JPEG would show
a white box behind it.

First load is now ~1.4 MB. Videos are never fetched until a channel is hovered
or opened.

`npm run fonts` does the same job for the two Wii system fonts: they are full
Japanese Gothic faces (8,600 glyphs, 2.4 MB), and the site only renders Latin,
so they are subset to WOFF2 at 7.7 KB. Sources live in `tools/font-src/`;
you only need to re-run this if you change which characters the UI uses.

---

## Layout of the repo

```
index.html              markup shell
assets/css/wii.css      all styling
assets/js/channels.js   ← the only file you normally edit
assets/js/wii.js        menu behaviour
assets/img|audio|fonts  Wii chrome (see Credits)
public/wiimerica/       your original art and video (path unchanged — see below)
public/thumbs/          generated — do not edit by hand
tools/                  dev server, thumbnail + font build scripts
```

## Controls

| Input | Action |
| --- | --- |
| Click / `A` / `Enter` / `Space` | Leave the boot screen |
| Click a channel | Open it |
| `←` `→` | Turn the page |
| `Esc` | Back to the menu |
| Speaker button, top right | Mute |

---

## Credits and licensing

The Wii chrome — the two system fonts, the startup and hover sounds, the
background texture, the bottom bar, the cursor and the page arrows — comes from
[danintosh/Wii-Menu-HTML](https://github.com/danintosh/Wii-Menu-HTML), MIT
licensed. Its licence is kept at
[`assets/LICENSE-danintosh-wii-menu-html.txt`](assets/LICENSE-danintosh-wii-menu-html.txt).
All layout, styling and behaviour in this repo was written for this project.

[andrewplus/Wii.JS](https://github.com/andrewplus/Wii.JS) was reviewed as a
reference but **no code or assets from it were used** — it is GPL-3.0, which
would have required publishing this entire site under the GPL.

Both repositories were scanned before use: no obfuscated code, no remote
payloads, no wallet or crypto hooks, no telemetry. See the note in the handoff
about the underlying Nintendo assets.
