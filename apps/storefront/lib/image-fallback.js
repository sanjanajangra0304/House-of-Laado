/**
 * Standard fallback for image loading errors across the storefront.
 * Includes a self-contained, brand-styled SVG fallback (Navy / Warm Beige)
 * that renders reliably even without internet or when external CDNs fail.
 */
export const DEFAULT_PRODUCT_FALLBACK =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect fill='%23FAF7F2' width='600' height='800'/%3E%3Crect x='1' y='1' width='598' height='798' fill='none' stroke='%23E8DCC8' stroke-width='2'/%3E%3Cg fill='%231F2A44' opacity='0.25'%3E%3Cpath d='M300 320c-25 0-45 20-45 45s20 45 45 45 45-20 45-45-20-45-45-45zm0 110c-50 0-90 30-90 70v40h180v-40c0-40-40-70-90-70z'/%3E%3C/g%3E%3Ctext x='300' y='630' font-family='serif' font-size='22' fill='%231F2A44' opacity='0.55' text-anchor='middle' letter-spacing='2'%3EHOUSE OF LAADO%3C/text%3E%3Ctext x='300' y='665' font-family='sans-serif' font-size='13' fill='%231F2A44' opacity='0.4' text-anchor='middle'%3EJaipur Artisanal Fashion%3C/text%3E%3C/svg%3E";

/**
 * Event handler for <img> onError
 */
export function onProductImageError(event, customFallback = DEFAULT_PRODUCT_FALLBACK) {
  if (event?.currentTarget) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = customFallback;
  }
}

/**
 * Event handler for secondary hover <img> onError
 * Gracefully hides secondary image to prevent broken hover state
 */
export function onSecondaryImageError(event) {
  if (event?.currentTarget) {
    event.currentTarget.style.display = "none";
  }
}
