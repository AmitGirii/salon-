# 3D model drop-point

Place the production salon export here as **`salon.glb`**, then set
`MODEL.useGltf = true` in `src/config/room.config.ts`.

Until that file exists the site renders the procedural salon in
`src/components/3d/SalonRoom.tsx`. Nothing here is imported at build time, so
an empty folder is a valid state — the loader probes for the file at runtime
and falls back silently.

See the README section "Swapping in the real GLB" for export settings.

## Optional: Draco decoders

If the export is Draco-compressed and you would rather not depend on the
public CDN, copy the decoder files from
`node_modules/three/examples/jsm/libs/draco/gltf/` into `public/draco/`.
The path is configured as `MODEL.dracoPath`.
