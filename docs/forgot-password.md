# Forgot Password

## Overview

Users who have forgotten their password can request a reset link from the login page. A time-limited token is generated, stored in the database, and emailed to the user via AWS SES. Clicking the link lets them set a new password. The token is single-use and expires after 1 hour.

---

## Flow

```
User clicks "Forgot password?" on /login
          |
          v
Enters email on /forgot-password
          |
          v
POST /api/auth/forgot-password
  - Look up user by email
  - Delete any existing token for that email
  - Generate 32-byte cryptographically secure token
  - Store token + 1-hour expiry in PasswordResetToken table
  - Send reset email via AWS SES
  - Always return { success: true } (don't reveal if email exists)
          |
          v
User receives email → clicks "Reset Password" link
          |
          v
/reset-password?token=<token>
          |
          v
POST /api/auth/reset-password
  - Find token in DB
  - Check token has not expired
  - bcrypt-hash new password (cost 12)
  - Update user.password
  - Delete token (single-use)
          |
          v
Redirect to /login
```

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Forgot Password | `/forgot-password` | Email input form. Shows "check your inbox" confirmation after submit regardless of whether the email is registered. |
| Reset Password | `/reset-password?token=<token>` | New password + confirm fields. Shows success state and redirects to `/login` after 3 seconds. If the token is missing or expired, shows an error with a link back to `/forgot-password`. |

---

## API Routes

### `POST /api/auth/forgot-password`

**Body:**
```json
{ "email": "user@example.com" }
```

**Behaviour:**
- Always returns `{ "success": true }` — even if no account exists for the email, to prevent user enumeration
- Deletes any previously issued (unused) token for the same email before creating a new one
- Token is a 64-character hex string generated with `crypto.randomBytes(32)`
- Expiry: 1 hour from creation

**Response:**
```json
{ "success": true }
```

---

### `POST /api/auth/reset-password`

**Body:**
```json
{
  "token": "<64-char hex token>",
  "password": "newpassword123"
}
```

**Validation:**
- Token must exist in the `PasswordResetToken` table
- Token must not be expired (`expiresAt > now`)
- Password must be at least 8 characters

**On success:**
- Updates `user.password` with bcrypt hash (cost 12)
- Deletes the token record

**Error responses:**

| Status | Message |
|--------|---------|
| `400` | `"Token and password are required"` |
| `400` | `"Password must be at least 8 characters"` |
| `400` | `"Invalid or expired reset link"` — token not found |
| `400` | `"This reset link has expired. Please request a new one."` — token found but past expiry |

---

## Database

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
}
```

- Indexed on `email` so existing tokens can be deleted quickly on re-request
- `token` is unique — prevents duplicates at the DB level
- No relation to the `User` model — looked up by `email` on use

---

## Email (AWS SES)

Sent via `lib/email.ts` using `@aws-sdk/client-ses`. Reuses the existing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` credentials.

### Environment variables

| Variable | Description |
|----------|-------------|
| `SES_FROM_EMAIL` | Verified sender address in AWS SES (e.g. `noreply@yourdomain.com`) |
| `AWS_ACCESS_KEY_ID` | Already set for S3/CloudFront — reused |
| `AWS_SECRET_ACCESS_KEY` | Already set for S3/CloudFront — reused |
| `AWS_SES_REGION` | Optional — falls back to `AWS_REGION` if not set |

### IAM permission required

The IAM user needs `ses:SendEmail` on the verified sender identity:

```json
{
  "Effect": "Allow",
  "Action": "ses:SendEmail",
  "Resource": "arn:aws:ses:<region>:<account-id>:identity/noreply@yourdomain.com"
}
```

### Verifying the sender in AWS SES

1. Go to **AWS Console → SES → Verified identities**
2. Click **Create identity** → choose **Email address** or **Domain**
3. Complete verification (click the link in the confirmation email, or add the DNS TXT record for domain verification)
4. If your account is in the **SES sandbox**, you can only send to verified addresses. Request production access to send to anyone.

---

## Security Notes

- **User enumeration prevention** — the forgot-password endpoint always returns `{ success: true }`, so an attacker cannot determine which emails are registered
- **Token rotation** — requesting a new reset link invalidates the previous one (old token is deleted before the new one is created)
- **Single-use** — the token is deleted immediately after the password is updated; it cannot be reused
- **Short expiry** — tokens expire after 1 hour
- **No token in URL after use** — the reset page redirects to `/login` on success, so the token is no longer in the browser's address bar
