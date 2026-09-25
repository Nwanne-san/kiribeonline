# Email Brand Indicators (BIMI) — Kiribé

Plan for getting the Kiribé logo to display next to every email sent from
`kiribeonline.com` — both the QServers team mailboxes (`hello@`, `nwanne@`, ...)
and the Resend transactional subdomain (`send.kiribeonline.com`) — in Gmail,
Yahoo, Fastmail, and Apple Mail.

The core work is **DMARC hardening** followed by **BIMI publication**. BIMI-
capable mail clients require domain-authenticated mail (SPF + DKIM aligned)
under an enforced DMARC policy before they show the logo — so this plan front-
loads the DMARC ramp, and only publishes BIMI once we're safely at
`p=quarantine; pct=100` or `p=reject`.

Legend: ✅ done · 🔨 in progress · ⬜ planned

---

## Current DNS state

Audited on 2026-09-25 with `dig`:

| Record | Value | Status |
|--------|-------|--------|
| `kiribeonline.com` SPF | `v=spf1 +mx +ip4:147.124.195.111 ~all` | ✅ QServers IP, softfail |
| `kiribeonline.com` DKIM | `default._domainkey` present | ✅ QServers signing |
| `kiribeonline.com` DMARC | `v=DMARC1; p=none;` | ⚠️ monitor-only — **BIMI blocker** |
| `send.kiribeonline.com` DKIM | `resend._domainkey` present | ✅ Resend signing |
| `send.kiribeonline.com` DMARC | (inherits `p=none`) | ⚠️ inherits blocker |
| BIMI (apex and `send.`) | not set | ⬜ Phase 3 |

The primary blocker is the single `p=none;` on `_dmarc.kiribeonline.com`. All
BIMI-capable clients ignore domains at `p=none`. Everything else on the
sending posture (DKIM on both mailboxes and Resend, sane SPF) is in place.

---

## Phase 1 — DMARC reporting (this week, free) — ⬜

**Goal:** stay at `p=none` but start collecting aggregate reports so we can
see who else is sending on our behalf (Mailchimp? forwarders? spoofers?)
before flipping to enforcement.

### Prerequisite

Sign up at [dmarc.postmarkapp.com](https://dmarc.postmarkapp.com) with any
work email. Postmark's DMARC digests are free forever and email a
human-readable weekly summary parsed from the XML the receivers send. On
signup they'll issue a per-domain reporting address like
`randomstring@rua.dmarcdigests.com`.

### DNS change (cPanel → Zone Editor → `kiribeonline.com`)

Find the existing TXT record whose value starts with `v=DMARC1;` on the
`_dmarc` host and replace its value with:

```
v=DMARC1; p=none; rua=mailto:<YOUR-POSTMARK-ADDRESS>@rua.dmarcdigests.com; fo=1; adkim=r; aspf=r;
```

Substitute `<YOUR-POSTMARK-ADDRESS>` with the exact address Postmark gave
you. Save. Propagation is usually within an hour but can take up to 24h.

### Why each field

- `p=none` — still monitor-only. **Do not** skip to `quarantine` here; if any
  legitimate sender (Mailchimp, a forwarder) is unaligned, they'd start
  landing in spam immediately.
- `rua=mailto:...` — where receivers send aggregate XML reports (daily).
- `fo=1` — send failure reports if any check (SPF or DKIM) fails, not just
  if both fail. Better signal.
- `adkim=r; aspf=r` — relaxed alignment (matches the default; explicit for
  future readers).

### Exit criteria (2–4 weeks)

- Postmark dashboard shows all legitimate senders identified.
- All flows show **SPF or DKIM aligned = pass**. If a sender is misaligned
  (e.g., Mailchimp is sending as `kiribeonline.com` without domain
  authentication), fix that first — see [Sender inventory](#sender-inventory)
  below.
- No unexplained spikes in unauthenticated volume.

---

## Phase 2 — DMARC enforcement ramp (weeks 3–8) — ⬜

Once Phase 1 exit criteria are met, ramp progressively. Each step waits
**~7 days** to watch Postmark for false-positives.

Change the DMARC TXT value in cPanel at each step:

1. `v=DMARC1; p=quarantine; pct=25; rua=mailto:...; fo=1; adkim=r; aspf=r;`
2. `v=DMARC1; p=quarantine; pct=100; rua=mailto:...; fo=1; adkim=r; aspf=r;`
3. `v=DMARC1; p=reject; pct=100; rua=mailto:...; fo=1; adkim=r; aspf=r;`

If any step spikes legitimate-mail failures in Postmark, roll back to the
previous value, fix the offending sender's alignment, then retry.

### BIMI unlocks at step 2

Gmail requires DMARC at `p=quarantine; pct=100` **or** `p=reject; pct=100`
**for at least 7 days** before it will start rendering BIMI. So Phase 3 can
technically publish DNS between step 2 and step 3, but wait until at least
step 2 has settled with no false-positives.

---

## Phase 3 — Publish BIMI (once at `pct=100`) — ⬜

Three assets and one DNS record per zone.

### 3.1 — SVG Tiny PS logo

BIMI uses a specific SVG dialect (`baseProfile="tiny-ps"`) that many tools
don't emit by default. Requirements:

- **Square** viewBox (e.g., `viewBox="0 0 512 512"`), same width and height.
- `baseProfile="tiny-ps"` on the root `<svg>` element.
- Single fill color, on-brand (burgundy `#6b1d2a` or a solid burgundy
  background with the K in mustard `#c9a227`).
- No scripts, no external references (no `<image>` tags, no imported fonts),
  no `<foreignObject>`.
- File under 32 KB.
- `<title>` element inside the SVG naming the brand.

**Source:** start from `public/brand/kiribe-mark.svg` (the K glyph — do not
use the wordmark, BIMI logos are square).

**Convert to Tiny PS:** run through the [BIMI Group SVG converter](https://bimigroup.org/creating-bimi-svg-logo-files/)
or upload to Entrust's [BIMI Logo Manager](https://www.entrust.com/bimi-generator).

**Publish at:** `public/brand/bimi/kiribe-mark.svg` — served from
`https://kiribeonline.com/brand/bimi/kiribe-mark.svg` over HTTPS with a
valid cert.

### 3.2 — Certificate

Gmail *requires* one of these; Apple Mail and Yahoo will render the BIMI
logo without a certificate (they treat it as best-effort), but Gmail
enforces.

| Cert type | Cost/year | Requires | Providers |
|-----------|-----------|----------|-----------|
| **VMC** — Verified Mark Certificate | ~$1,300 | Registered trademark on "Kiribé" | DigiCert, Entrust |
| **CMC** — Common Mark Certificate | ~$500 | Only domain ownership | DigiCert (Gmail added CMC support in early 2024) |

Recommend **CMC** unless the Kiribé wordmark is already trademark-registered
in a jurisdiction the providers accept (US PTO, EU IPO, UK IPO, etc.).

The cert is issued as a PEM file. Host at
`public/brand/bimi/kiribe.pem` served from
`https://kiribeonline.com/brand/bimi/kiribe.pem`.

### 3.3 — DNS records (cPanel → Zone Editor)

Add two TXT records — one for the apex, one for the Resend subdomain:

```
Host:  default._bimi.kiribeonline.com
Type:  TXT
Value: v=BIMI1; l=https://kiribeonline.com/brand/bimi/kiribe-mark.svg; a=https://kiribeonline.com/brand/bimi/kiribe.pem
```

```
Host:  default._bimi.send.kiribeonline.com
Type:  TXT
Value: v=BIMI1; l=https://kiribeonline.com/brand/bimi/kiribe-mark.svg; a=https://kiribeonline.com/brand/bimi/kiribe.pem
```

Same URL for both — the K asset is reused. Gmail treats subdomains as
separate BIMI domains, so both need the record.

### 3.4 — Verify

- [BIMI Inspector](https://bimigroup.org/bimi-generator/) — validates the
  SVG, cert, and DNS.
- Gmail's own [Postmaster Tools](https://postmaster.google.com) — for
  authenticated volume and BIMI eligibility signals.
- Send a test to a Gmail address you own with the domain fully propagated;
  the K should appear in the sender chip within ~24h of Gmail seeing the
  first authenticated send after DMARC has been at `pct=100` for 7d.

---

## Parallel quick win — Gravatar (free, 5 min)

While DMARC ramps and BIMI cert procurement happens (weeks), Gravatar covers
the **non-Gmail** clients — Apple Mail (macOS/iOS), some Outlook web setups,
Slack, WordPress, and any tool that resolves avatars via Gravatar.

For each address (`hello@`, `nwanne@`, and every team mailbox), register at
[gravatar.com](https://gravatar.com), verify the address, and upload the
burgundy K. Instant partial coverage. Gmail ignores Gravatar entirely — so
this is **complementary** to BIMI, not a replacement.

---

## Sender inventory

Track every non-primary sender authenticating as `kiribeonline.com` so we can
verify each is DKIM+SPF aligned before flipping DMARC to `quarantine`:

| Sender | Purpose | DKIM aligned? | Notes |
|--------|---------|---------------|-------|
| QServers cPanel (`mail.kiribeonline.com`) | Team mailboxes | ✅ via `default._domainkey` | verified 2026-09-25 |
| Resend (`send.kiribeonline.com`) | Transactional | ✅ via `resend._domainkey` | verified 2026-09-25 |
| Mailchimp | Newsletter (if used) | ⬜ verify | Requires domain auth in Mailchimp dashboard |
| _(add others as Postmark reports surface them)_ | | | |

If Mailchimp isn't domain-authenticated yet, do that in the Mailchimp
dashboard *before* Phase 2 step 1. Otherwise newsletters land in spam.

---

## Estimated timeline

| Phase | Elapsed | Notes |
|-------|---------|-------|
| 1 — reporting | week 0 | 1h of DNS + Postmark signup |
| 1 → 2 gate | weeks 1–4 | passive, monitoring |
| 2 — enforcement ramp | weeks 4–7 | 3 DNS changes, ~1h each |
| 3 — BIMI publish | weeks 7–10 | cert procurement is the long pole (VMC 2–4 weeks; CMC ~1 week) |
| **Total** | **~10 weeks** to seeing K in Gmail | |

---

## Rollback

At any step, revert the DMARC TXT value to the previous version. DMARC
enforcement is purely a receiver-side signal — no persistent state on our
end. Propagation to reverse is the same 1–24h.

If BIMI has been published and needs to be pulled (e.g., cert lapses),
delete both `default._bimi.*` TXT records. Absence = clients show the
default letter avatar again; no other side effects.
