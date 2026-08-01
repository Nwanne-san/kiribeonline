/**
 * About renders no skeleton.
 *
 * `(site)/loading.tsx` is a homepage-shaped skeleton (hero + picks + category
 * grids) and, being a group-level boundary, it also covers every nested route
 * that doesn't override it. About is fully static — there is nothing to wait
 * for — so readers saw a flash of the wrong layout on the way in. Route
 * feedback still comes from the global `RouteProgress` bar.
 */
export default function AboutLoading() {
  return null;
}
