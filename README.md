# RoboSwitch

A browser-based arena game built with vanilla JS and HTML5 Canvas.

## Play locally

Because this uses ES modules (`type="module"`), you can't just double-click `index.html` —
browsers block module loading over the `file://` protocol. Serve it locally instead:

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `roboswitch`).
2. Push this folder's contents to the repo root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/roboswitch.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
5. Save. Your game will be live at:
   `https://YOUR_USERNAME.github.io/roboswitch/`

All asset paths in the code use `new URL(..., import.meta.url)` or relative paths,
so it'll work whether it's served at the root of a domain or in a subfolder like
`/roboswitch/` — no path changes needed.

## Notes

- `assets/pixel/*.py` are the source generation scripts used to produce the pixel art —
  not used at runtime by the game itself, kept for reference.
- Music/SFX are `.ogg` files loaded on demand by `src/audio.js` and `src/game.js`.
