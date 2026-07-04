---
name: security-review
description: Security checklist for Kiribe Online — Next.js, Payload, Neon, R2
metadata:
  type: feedback
---

# Security review checklist

## Authentication (TRD §9)

- [ ] Passwords hashed (Payload default bcrypt)
- [ ] Session expiration configured
- [ ] Admin routes protected in middleware AND server handlers
- [ ] 401 clears session cookie and redirects to login
- [ ] Brute-force protection on login (rate limit)

## Input validation

- [ ] Contact/subscribe: email format, length limits, honeypot or CAPTCHA if spam persists
- [ ] Article slugs: unique, URL-safe
- [ ] Search: parameterized queries, no raw SQL concatenation

## File uploads (TRD §13)

- [ ] Allowlist image types (jpeg, png, webp, gif)
- [ ] Max file size enforced server-side
- [ ] Stored in R2 with non-guessable keys
- [ ] No SVG uploads unless sanitized

## Headers & CSRF

- [ ] Security headers via Next.js config or Cloudflare
- [ ] CSRF on cookie-authenticated form POSTs where applicable

## Data protection

- [ ] `DATABASE_URL`, `PAYLOAD_SECRET`, R2 keys in env only
- [ ] Audit log captures admin mutations
- [ ] Backups documented for Neon

## Client exposure

- [ ] No admin API keys in browser
- [ ] Rich text rendered through safe serializer
- [ ] `dangerouslySetInnerHTML` avoided or sanitized

## How to apply

Run this checklist on any PR touching auth, forms, uploads, or Payload collections.
