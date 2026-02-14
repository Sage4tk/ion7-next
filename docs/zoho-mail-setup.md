# Zoho Mail Integration Setup

This guide covers setting up the Zoho Mail API to create and manage email accounts for customer domains.

## Prerequisites

- A Zoho Mail admin account with an active organization
- The domain must be added and verified in Zoho Mail Admin before creating email accounts

## 1. Create a Self Client

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click **Add Client** → select **Self Client**
3. Note down the **Client ID** and **Client Secret**

## 2. Generate a Grant Token

1. In the Self Client page, click **Generate Code**
2. Enter the scope: `ZohoMail.organization.accounts.ALL`
3. Set a description (e.g., "ion7 email management")
4. Choose a time duration and click **Create**
5. Copy the generated **grant token** — it expires in a few minutes, so use it quickly

## 3. Exchange for a Refresh Token

Make a POST request to exchange the grant token for a refresh token:

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_GRANT_TOKEN"
```

The response will include:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

Save the **refresh_token** — it does not expire. Access tokens last 1 hour and are auto-refreshed by the app.

## 4. Get Your Organization ID

1. Log in to [Zoho Mail Admin](https://mailadmin.zoho.com/)
2. Go to **Dashboard** or **Organization** settings
3. The Organization ID (ZOID) is displayed there, or visible in the URL

## 5. Add Domain to Zoho Mail

Before creating email accounts for a domain, the domain must be set up in Zoho Mail:

1. In Zoho Mail Admin, go to **Domains** → **Add Domain**
2. Enter the domain name and verify ownership (usually via DNS TXT record)
3. Configure MX records to point to Zoho's mail servers:
   - `mx.zoho.com` (priority 10)
   - `mx2.zoho.com` (priority 20)
   - `mx3.zoho.com` (priority 50)

## 6. Configure Environment Variables

Add the following to your `.env.local`:

```
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORG_ID=your_organization_id
```

## How It Works

- Users can create up to **10 email accounts** per domain
- Each account requires an **email prefix** (e.g., `info`) and a **password** (min 8 characters)
- The app calls Zoho's API to create/delete the actual mailbox
- Email metadata is stored in the database for tracking
- Access tokens are cached in memory and auto-refreshed before expiry

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains/[id]/emails` | List all emails for a domain |
| POST | `/api/domains/[id]/emails` | Create an email account |
| DELETE | `/api/domains/[id]/emails` | Delete an email account |

### POST body

```json
{
  "prefix": "info",
  "password": "securepassword"
}
```

### DELETE body

```json
{
  "emailId": "cuid_of_email_record"
}
```

## Troubleshooting

- **"Zoho token refresh failed"** — Check that `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` are correct
- **"Zoho create account failed"** — The domain may not be verified in Zoho Mail, or the email prefix is invalid/taken
- **"Zoho delete account failed"** — The account may have already been deleted in Zoho's admin panel
