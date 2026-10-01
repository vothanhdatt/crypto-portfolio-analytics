# Accessibility and Production QA

Audit date: 2026-10-01

## Scope

The production Next.js build was tested against the sample portfolio using keyboard navigation, the browser accessibility tree, computed styles, responsive layout measurements, and console/runtime event capture.

## Results

- Keyboard: 55 consecutive Tab events traversed the file picker, chart data points and legends, horizontal scroll regions, transaction filters, timestamp sorting, page-size control, and pagination before focus returned to the start. No unnamed focus target or keyboard trap was found.
- Forms: all seven rendered `input` and `select` controls have an associated label. Transaction filters use a `fieldset` and screen-reader legend.
- Tables: holdings and transactions use `table`, `caption`, `thead`, `tbody`, column headers with `scope="col"`, and row headers with `scope="row"`.
- Contrast: sampled text ratios range from 5.07:1 to 17.95:1 against their rendered surfaces. Positive and negative performance text measured 11.81:1 and 9.67:1 respectively.
- Mobile overflow: at a 390 px viewport, both document and body widths remained 390 px. The P&L chart, holdings table, and transaction table contain their wider content in named horizontal scroll regions.
- Loading: exposed as an atomic polite `status` with `aria-busy="true"` and the accessible name “Loading portfolio”.
- Error: exposed as an `alert` named “We couldn't load this portfolio.” with a keyboard-accessible retry button.
- Console: a clean production load produced zero console errors, runtime exceptions, or failed resource log entries.
- Build: `next build --webpack` completed successfully.

## Verification commands

```bash
npm test
npm --prefix crypto-portfolio-be run lint
npm --prefix crypto-portfolio-fe run lint
npm --prefix crypto-portfolio-fe run typecheck
npm --prefix crypto-portfolio-fe run build
```
