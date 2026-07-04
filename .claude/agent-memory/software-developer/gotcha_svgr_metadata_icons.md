---
name: svgr-metadata-icons
description: next-svgr's broad .svg webpack rule breaks Next app-dir metadata icons (icon.svg/apple-icon/opengraph) unless excluded
metadata:
  type: feedback
---

`next-svgr` (`node_modules/next-svgr/src/withSvg.js`) pushes an unconditional
`{ test: /\.svg$/, use: ["@svgr/webpack"] }` webpack rule. This intercepts Next's
App Router metadata image imports (e.g. `src/app/icon.svg` imported internally
with `?__next_metadata__`), so `next build` fails with
`Image import ... is not a valid image file`.

**Why:** SVGR turns the SVG into a React component before Next's metadata image
loader can read it. `image-size` actually parses the file fine — it's the loader
chain that's wrong.

**How to apply:** In `next.config.ts` add a `webpack(config)` fn that finds the
SVGR rule and sets `rule.resourceQuery = { not: [/__next_metadata__/] }`. This is
already in place. Any future metadata SVG (apple-icon, opengraph-image.svg) is
covered by the same exclusion. Turbopack dev uses the separate `turbopack.rules`
config, which does not hit this issue.

Related: [[gotcha_illustrations_error_boundaries]].
