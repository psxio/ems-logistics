# Elite Medical Response Management

Public site: https://psxio.github.io/ems-logistics/
Interactive demo: https://psxio.github.io/ems-logistics/demo.html

`index.html` is the public Elite Medical Response Management website. Its ride inquiries open the supplied dispatch number; email links open the supplied business address. The page has no online booking form. `site.js` controls the responsive menu.

`Elite-Medical-Service-Overview.pdf` is the one-page public service guide. The previous `EMS-Logistics-Simple-Plan.pdf` URL serves the same guide so existing shared links continue to work.

`demo.html`, `demo.js`, and `demo.css` preserve the separate sample-data workflow prototype. It is not linked from the public homepage, and its records are not real bookings. The six workflows remain available for future backend integration.

No custom domain has been configured yet. The site and its internal asset links work beneath the existing GitHub Pages path or a future domain.

## Demo functions
- Three-step patient/family or provider ride request.
- Site Leads with ownership, review checks, follow-up dates, search and filters.
- Four-week recurring round-trip calendar, rescheduling, cancellation, dispatch handoff and completion.
- Simulated incoming calls with sample caller/location/assigned-center details and linked requests.
- Fictional center lookup with clearly illustrative distances.
- Sample provider directory, editable email preview and simulated campaign history.
- Browser-local persistence and confirmed reset; no external requests, real calling, real email delivery, authentication or shared database.

Fictional rider and facility contacts use reserved 555-01xx numbers and example.com emails. Business contacts and the supplied Elite logo were updated on October 30, 2026; they are separate from the demo data. Profiles and facilities are fictional. Do not enter real patient information. Only sample profiles can be selected in intake.

Preview: `python3 -m http.server 4187 --bind 127.0.0.1` from this folder.

Publishing uses the dedicated Git checkout in `../outputs/ems-logistics-public` and branch `codex/ems-site`. Copy only the selected website assets, PDF and README into that checkout. Never publish the full FRITZ workspace, private source notes or backups.
