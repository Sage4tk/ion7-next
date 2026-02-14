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
