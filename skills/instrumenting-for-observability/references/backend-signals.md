# Backend Signals

Services, jobs, and queue consumers share a small set of failure shapes, which is why a default template works well here: most of the value comes from applying RED consistently and then adding the two or three signals specific to the work being done.

## RED, concretely

For any request handler or job processor:

| Signal | Type | Labels |
| --- | --- | --- |
| `<domain>_<subject>_total` | Counter | outcome (`success` / `failure` / `rejected`), plus a reason or type when it varies |
| `<domain>_<subject>_duration_seconds` | Histogram | The same primary dimension, but keep the label set small — histograms multiply series per bucket |
| `<domain>_<subject>_in_flight` | Gauge | Concurrency, when saturation is plausible |

Naming conventions that pay off later: units in the name (`_seconds`, `_bytes`), `_total` on counters, and the same domain prefix as the rest of the service. Match whatever the repo already does over any of this.

**Errors and rejections are different outcomes.** A rejected request (bad signature, failed validation, unauthorised) is usually the system working correctly, while an error is the system failing. Collapsing them into one `failure` bucket means an attack and an outage look identical on the graph.

## Queues, consumers, and background jobs

Async work needs signals a request handler doesn't, because the failure is usually *falling behind* rather than *returning an error*:

- **Queue depth** (gauge) — is work accumulating?
- **Age of the oldest unprocessed item** (gauge) — often more actionable than depth, since a large fast-draining queue is fine and a small stuck one is not
- **Retry count and dead-letter count** (counters) — silent retry storms are a classic invisible outage
- **Processing duration** (histogram) — separately from end-to-end latency, which includes queue wait
- **End-to-end lag** — enqueue timestamp to completion, which is what a user actually experiences

For anything triggered by an external provider (webhooks, callbacks), also count what you reject and why. A spike in signature failures is either an attack or a secret rotation that nobody finished, and both are urgent.

## Error categorisation

Label metrics by a **category**, not by the exception message or class hierarchy:

```
timeout | rate_limited | bad_input | not_found | conflict | dependency_error | internal
```

Raw exception messages routinely embed IDs, values, and file paths, which puts them straight back into the unbounded-label problem. The message belongs in the log line, keyed alongside the same category so the two can be joined.

## Cardinality traps

| Tempting | Why it's a problem | Instead |
| --- | --- | --- |
| Raw URL path | `/orders/1234` creates one series per order | Route template `/orders/:id` |
| Tenant or customer ID | Fine at 50 tenants, ruinous at 500,000 | Plan tier or shard; keep the ID on spans and logs |
| SQL statement text | Unbounded | Query name or operation |
| Exception message | Contains values | Error category |
| Timestamp or duration as a label | Infinite | That's what histograms are for |

## Correlating across processes

When work crosses a boundary — endpoint enqueues, worker processes — the two halves must be joinable:

- Propagate trace context through the queue message so the consumer's span links back to the producer's.
- Carry a stable business identifier (event ID, idempotency key, order ID) as a **span attribute and log field** in both halves.
- Log that identifier on every failure path in both processes. "Why didn't order X update?" is answerable only if the same key appears on both sides.

## Dependencies

A service is often healthy while its dependencies are not, and dependency signals localise an incident faster than anything else:

- Outbound call counters and latency, labelled by dependency name and status class
- Connection pool utilisation and wait time — pool exhaustion presents as unexplained latency across every endpoint at once
- Circuit breaker state transitions, if breakers are in use

## Verifying

- Hit the endpoint, then read the metrics endpoint and confirm the series exists with the expected label values — a metric defined but never registered is completely silent.
- Force the failure path deliberately (bad payload, wrong signature, a stubbed timeout) and confirm the failure counter increments with the right category.
- Check spans actually close. An unclosed span never gets exported, so the trace simply doesn't appear rather than appearing broken.
- For consumers, enqueue one item and confirm the trace spans both processes and shares the correlation key.
- Confirm no secret, payload body, or personal field reached the log output — read the actual emitted line rather than the code that produced it.
