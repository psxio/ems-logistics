# EMS Logistics

Public site: https://psxio.github.io/ems-logistics/
Interactive demo: https://psxio.github.io/ems-logistics/demo.html

`index.html` is the family-led, patient-facing homepage, with a navy/red visual identity and a responsive menu in `site.js`. `demo.html`, `demo.js`, and `demo.css` implement the linked sample-data workflows. The two-page PDF explains the concept and full software scope.

## Demo functions
- Three-step patient/family or provider ride request.
- Site Leads with ownership, review checks, follow-up dates, search and filters.
- Four-week recurring round-trip calendar, rescheduling, cancellation, dispatch handoff and completion.
- Simulated incoming calls with sample caller/location/assigned-center details and linked requests.
- Fictional center lookup with clearly illustrative distances.
- Sample provider directory, editable email preview and simulated campaign history.
- Browser-local persistence and confirmed reset; no external requests, real calling, real email delivery, authentication or shared database.

Sample phone numbers use the reserved 555-01xx range; emails use example.com. Profiles and facilities are fictional. Do not enter real patient information. Only sample profiles can be selected in intake.

Preview: `python3 -m http.server 4187 --bind 127.0.0.1` from this folder.

Publishing uses the dedicated Git checkout in `../outputs/ems-logistics-public` and branch `codex/ems-site`. Copy only the selected website assets, PDF and README into that checkout. Never publish the full FRITZ workspace, private source notes or backups.
