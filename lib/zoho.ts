const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID!;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?${params}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(`Zoho token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return cachedToken.token;
}

export async function createEmailAccount(
  email: string,
  password: string,
  displayName?: string,
) {
  const token = await getAccessToken();

  const res = await fetch(
    `https://mail.zoho.com/api/organization/${ZOHO_ORG_ID}/accounts`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        primaryEmailAddress: email,
        password,
        displayName: displayName || email.split("@")[0],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoho create account failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.data as { zuid: string; primaryEmailAddress: string };
}

export async function deleteEmailAccount(emailAddress: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `https://mail.zoho.com/api/organization/${ZOHO_ORG_ID}/accounts`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailIds: [{ emailId: emailAddress }],
        mode: "deleteAccount",
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoho delete account failed: ${res.status} ${body}`);
  }

  return true;
}
