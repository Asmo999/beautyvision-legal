# BeautyVision Admin

React/Vite admin UI served from the `beautyvision-legal` repo at `/admin`.

## API

Set `VITE_API_URL` to the BeautyVision API origin before building:

```bash
VITE_API_URL=https://api.example.com npm run build
```

The admin reads and writes catalog data through the API. MongoDB credentials and asset storage logic stay on the API side, never in this browser app.

## Media URLs

Image fields from MongoDB may be either:

- relative API paths, for example `/assets/products/image.webp`
- absolute CDN URLs, if a future storage layer returns them

The current backend stores uploaded admin images in MongoDB GridFS and returns relative `/assets/...` URLs. The UI resolves relative paths against `VITE_API_URL` and leaves absolute URLs unchanged.
