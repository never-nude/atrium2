# atrium.earth

A fresh static rebuild of Atrium, designed around a fast index and deliberate 3D loading.

## Development

```sh
npm install
npm run import:catalog
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run models:preview -- --limit 12
npm run dev
```

The old Atrium checkout is treated as source material. By default the scripts read from:

```txt
/Users/michael/Projects/_active/atrium
```

Set `SOURCE_ATRIUM_DIR` to point somewhere else.

## Loading Model

- `src/data/catalog.json` is generated from the old catalog.
- `public/models/previews/**/preview.glb` contains lightweight web previews.
- `src/data/previews.json` maps catalog slugs to generated preview files.
- The homepage never loads a model until the visitor asks for one.
