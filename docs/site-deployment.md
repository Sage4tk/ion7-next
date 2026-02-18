# Site Deployment — S3 + CloudFront

## Overview

Users publish their template-editor websites as static HTML hosted on AWS. Each site is served at `https://www.{domain}` via CloudFront with HTTPS (ACM certificate) and DNS managed through OpenProvider.

## Architecture

```
User clicks "Publish"
       |
       v
Generate static HTML from SiteContent JSON
       |
       v
Upload to S3: s3://ion7-sites/{domain}/index.html
       |
       v
Create/reuse CloudFront distribution (ACM cert for HTTPS)
       |
       v
Set DNS CNAME: www.{domain} -> d1234.cloudfront.net
       |
       v
Site live at https://www.{domain}
```

- **Single S3 bucket** (`ion7-sites`) with domain-prefixed keys
- **One CloudFront distribution per domain** with ACM certificate
- **DNS via OpenProvider** — CNAME on `www` subdomain pointing to CloudFront

## Environment Variables

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
S3_SITES_BUCKET=ion7-sites
```

The AWS IAM user needs permissions for S3 (PutObject), CloudFront (CreateDistribution, CreateInvalidation, GetDistribution), and ACM (RequestCertificate, DescribeCertificate). ACM certificates are always requested in `us-east-1` (CloudFront requirement).

## API

### `POST /api/domains/{id}/deploy`

Triggers a full deploy. Requires authentication and an active (non-frozen) account.

Steps:
1. Auth + frozen account check
2. Generate static HTML from `site.content`
3. Upload to S3
4. Create CloudFront distribution (first deploy) or reuse existing
5. Invalidate CloudFront cache (re-deploy)
6. Set `www` CNAME via OpenProvider if needed
7. Update domain record (`deployedAt`, `cloudfrontDistId`, `cloudfrontDomain`)

**Response:**
```json
{ "success": true, "url": "https://www.example.com", "deployedAt": "2026-02-18T..." }
```

### `GET /api/domains/{id}/deploy`

Returns deployment status.

**Response:**
```json
{ "deployed": true, "deployedAt": "2026-02-18T...", "url": "https://www.example.com" }
```

## Database Fields (Domain model)

| Field | Type | Description |
|---|---|---|
| `deployedAt` | `DateTime?` | Last successful deploy timestamp |
| `cloudfrontDistId` | `String?` | CloudFront distribution ID |
| `cloudfrontDomain` | `String?` | CloudFront domain (e.g. `d1234.cloudfront.net`) |

## Static HTML Generation

`lib/deploy/html.ts` converts the `SiteContent` JSON (theme + blocks) into a self-contained HTML document:

- All styles are inline (no Tailwind dependency)
- SVG icons are embedded (no lucide-react dependency)
- Responsive layout via CSS grid with `auto-fit`
- Supports all block types: hero, cards, text, gallery, contact, menu, pricing

## Key Files

| File | Purpose |
|---|---|
| `lib/deploy/html.ts` | Static HTML generator |
| `lib/deploy/s3.ts` | S3 upload |
| `lib/deploy/cloudfront.ts` | CloudFront + ACM management |
| `app/api/domains/[id]/deploy/route.ts` | Deploy API endpoint |
| `lib/openprovider.ts` | `setDomainCname()` for DNS |

## SSL Certificate Validation

When a new CloudFront distribution is created, an ACM certificate is requested with DNS validation. The certificate's DNS validation record needs to be added to the domain's DNS zone for the certificate to be issued. Until validated, CloudFront will serve with the default `*.cloudfront.net` certificate.

## Notes

- Sites are served at `www.{domain}` only (no apex/root domain — CNAME limitation)
- Re-deploys upload new HTML and invalidate the CloudFront cache (`/*`)
- Frozen accounts receive a 403 and cannot deploy
- First deploy may take a few minutes for CloudFront distribution propagation
