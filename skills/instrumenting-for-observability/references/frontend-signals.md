# Frontend Signals

Client-side instrumentation differs from server-side in four ways that change what's worth recording:

1. **The code runs on hardware and networks you don't control.** "Works on my machine" is the default state of every frontend bug, so device and network conditions are first-class dimensions rather than trivia.
2. **Delivery is unreliable.** Ad blockers, privacy extensions, offline states, and pages closing mid-request all silently drop telemetry. Absence of a signal is not evidence of absence of a problem.
3. **Volume scales with users, not with servers.** One event per session is one event per user. Sampling is a design consideration from the start.
4. **Almost everything nearby is personal data.** Form values, filenames, URLs, and page content are all one careless line away from a log.

## Questions worth asking

Beyond the standard set in the main skill:

- Does this work on real devices and real networks, or only on a developer laptop on office wifi?
- When it fails, is it the client-side work, the network, or the server's response?
- Is it broken only on one browser family, OS, or app version?
- Do users abandon this flow because it's slow, or because it's broken?
- Did the release actually reach users — are old bundle versions still live?

## Typical signals

| Question | Signal | Type | Notes |
| --- | --- | --- | --- |
| Is the operation succeeding? | `<feature>_total` | Counter | Label by outcome **and** stage, so one counter localises the failure |
| Where is time going? | `<feature>_duration_ms` | Timing | Measure with `performance.now()`, per stage |
| Is the page itself healthy? | Web Vitals (LCP, INP, CLS) | Timing | Almost always already wired up — reuse it |
| What broke for this user? | Error report | Error | With stage and safe context attached |
| Are API calls failing from the client's view? | `api_request_total` | Counter | Label by route template and status class; client-observed failure includes timeouts and CORS, which server metrics never see |

The `stage` variable pattern carries most of the weight. Track the current stage in a local variable, advance it as the flow progresses, and attach it to the failure counter — one counter then tells you *where* it broke rather than only *that* it broke.

## Cardinality traps

| Tempting | Why it's a problem | Instead |
| --- | --- | --- |
| Full user-agent string | Effectively unique per user | Browser family plus major version |
| `window.location.href` | Contains IDs, search terms, tokens | Route template (`/orders/:id`) |
| Exact viewport dimensions | Thousands of distinct values | Breakpoint bucket (mobile / tablet / desktop) |
| Exact file size or duration | Continuous | Log-ish buckets (`<1MB`, `1-10MB`, `>10MB`) |
| App or bundle version | Grows forever, but bounded per release window | Acceptable, but drop old series deliberately |

## Personal data traps

- **Filenames are personal.** `passport-scan-jane-doe.jpg` is a real filename. Record size bucket and mime type.
- **URLs are personal.** Query strings carry search terms, email addresses, and reset tokens. Send the route template.
- **Never attach form state to an error report.** Field *names* and validity flags are fine; values are not.
- **Error messages can embed user input.** Sanitise before attaching, especially for parse and validation errors.
- Check whether session replay is enabled on the page — if it is, confirm the new UI's sensitive fields are masked by its configuration.

## Delivery reliability

- Telemetry sent during page unload needs `navigator.sendBeacon` or `keepalive: true`; a normal `fetch` is cancelled when the page goes away.
- A meaningful share of users block telemetry endpoints entirely. Never build a correctness-critical process on client-reported counts, and expect client and server numbers to disagree by design.
- Wrap emission so it can never throw into application code — a telemetry failure must not become a user-visible error.
- Errors inside promise chains vanish unless caught at the boundary; make sure the flow's rejection path actually reaches the reporting call.

## Verifying

- Throttle to slow 3G in devtools and confirm the timing signal reports something plausible.
- Go offline mid-flow and confirm the failure counter fires with the right stage.
- Block the telemetry endpoint in devtools and confirm the app still works normally.
- Check the network tab for the actual outbound telemetry request — not just that the function was called.
- Test in one non-Chromium browser; `performance` and reporting APIs differ.
