let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://api.sandbox.openprovider.nl:8480/v1beta"
    : "https://api.openprovider.eu/v1beta";

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.OPENPROVIDER_USERNAME,
      password: process.env.OPENPROVIDER_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenProvider auth failed: ${res.status}`);
  }

  const json = await res.json();
  console.log("OpenProvider auth response:", json);
  cachedToken = json.data.token;
  // Cache for 24 hours
  tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  return cachedToken!;
}

async function apiRequest(path: string, body: unknown) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.desc || json.message || `OpenProvider request failed: ${res.status}`,
    );
  }
  return json;
}

export interface DomainCheckResult {
  domain: string;
  status: string;
  price: number | null;
  currency: string | null;
}

export async function checkDomains(
  name: string,
  extensions: string[],
): Promise<DomainCheckResult[]> {
  const domains = extensions.map((ext) => ({
    name,
    extension: ext,
  }));

  const json = await apiRequest("/domains/check", {
    domains,
    with_price: true,
  });

  const results: DomainCheckResult[] = (json.data.results ?? []).map(
    (r: {
      domain: string;
      status: string;
      price?: { product?: { price?: number; currency?: string } };
    }) => ({
      domain: r.domain,
      status: r.status,
      price: r.price?.product?.price ?? null,
      currency: r.price?.product?.currency ?? null,
    }),
  );

  return results;
}

async function apiGet(path: string) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.desc || json.message || `OpenProvider request failed: ${res.status}`,
    );
  }
  return json;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  prio?: number;
}

export async function listDnsRecords(domainName: string): Promise<DnsRecord[]> {
  const json = await apiGet(`/dns/zones/${domainName}/records`);
  const records: DnsRecord[] = (json.data.records ?? []).map(
    (r: { type: string; name: string; value: string; ttl: number; prio?: number }) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      ttl: r.ttl,
      prio: r.prio,
    }),
  );
  return records;
}

async function apiPut(path: string, body: unknown) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.desc || json.message || `OpenProvider request failed: ${res.status}`,
    );
  }
  return json;
}

const ZOHO_MX_RECORDS: DnsRecord[] = [
  { type: "MX", name: "", value: "mx.zoho.com", ttl: 3600, prio: 10 },
  { type: "MX", name: "", value: "mx2.zoho.com", ttl: 3600, prio: 20 },
  { type: "MX", name: "", value: "mx3.zoho.com", ttl: 3600, prio: 50 },
];

export async function addZohoMxRecords(domainName: string): Promise<void> {
  const existing = await listDnsRecords(domainName);

  const hasMx = existing.some(
    (r) => r.type === "MX" && r.value.includes("zoho.com"),
  );
  if (hasMx) return; // Already configured

  const records = [
    ...existing.map((r) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      ttl: r.ttl,
      prio: r.prio ?? 0,
    })),
    ...ZOHO_MX_RECORDS,
  ];

  await apiPut(`/dns/zones/${domainName}`, {
    name: domainName,
    records: { records },
  });
}

export async function setDomainCname(
  domainName: string,
  target: string,
): Promise<void> {
  const existing = await listDnsRecords(domainName);

  // Check if CNAME for www already points to the right target
  const hasCorrectCname = existing.some(
    (r) => r.type === "CNAME" && r.name === "www" && r.value === target,
  );
  if (hasCorrectCname) return;

  // Remove any existing www CNAME, keep everything else
  const filtered = existing.filter(
    (r) => !(r.type === "CNAME" && r.name === "www"),
  );

  const records = [
    ...filtered.map((r) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      ttl: r.ttl,
      prio: r.prio ?? 0,
    })),
    { type: "CNAME", name: "www", value: target, ttl: 3600, prio: 0 },
  ];

  await apiPut(`/dns/zones/${domainName}`, {
    name: domainName,
    records: { records },
  });
}

export async function registerDomain(
  name: string,
  extension: string,
): Promise<{ id: number }> {
  const handle = process.env.OPENPROVIDER_HANDLE;

  const json = await apiRequest("/domains", {
    domain: { name, extension },
    period: 1,
    owner_handle: handle,
    admin_handle: handle,
    tech_handle: handle,
    billing_handle: handle,
    ns_group: "dns-openprovider",
    autorenew: "default",
  });

  return { id: json.data.id };
}

export async function renewDomain(openproviderId: number): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/domains/${openproviderId}/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ period: 1 }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.desc || json.message || `OpenProvider renew failed: ${res.status}`,
    );
  }
}

export async function getDomainStatus(openproviderId: number): Promise<{
  status: string; // 'ACT' | 'REQ' | 'SCH' | 'FAI' | 'DEL'
  expiresAt?: Date;
} | null> {
  try {
    const json = await apiGet(`/domains/${openproviderId}`);
    const domain = json.data;
    return {
      status: domain.status,
      expiresAt: domain.expiration_date
        ? new Date(domain.expiration_date)
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function transferDomain(
  name: string,
  extension: string,
  authCode: string,
): Promise<{ id: number }> {
  const handle = process.env.OPENPROVIDER_HANDLE;

  const json = await apiRequest("/domains/transfer", {
    domain: { name, extension },
    auth_code: authCode,
    owner_handle: handle,
    admin_handle: handle,
    tech_handle: handle,
    billing_handle: handle,
    ns_group: "dns-openprovider",
    autorenew: "default",
  });

  return { id: json.data.id };
}
