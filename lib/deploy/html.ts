import type {
  SiteContent,
  ThemeColors,
  Block,
  HeroData,
  CardsData,
  TextData,
  GalleryData,
  ContactData,
  MenuData,
  PricingData,
} from "@/lib/blocks/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// SVG icons (inline replacements for lucide-react)
const icons = {
  mail: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  mapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  barChart: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  code: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  layout: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>',
  image: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  globe: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  briefcase: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
};

const cardIconMap: Record<string, string> = {
  Zap: icons.zap,
  Shield: icons.shield,
  BarChart: icons.barChart,
  Code: icons.code,
  Layout: icons.layout,
  Image: icons.image,
  Star: icons.star,
  Heart: icons.heart,
  Globe: icons.globe,
  Briefcase: icons.briefcase,
};

function renderHero(data: HeroData, theme: ThemeColors): string {
  const bgStyle = data.bgImage
    ? `background-image:url(${escapeHtml(data.bgImage)});background-size:cover;background-position:center;`
    : "";
  const overlay = data.bgImage
    ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)"></div>'
    : "";
  const cta = data.ctaText
    ? `<a href="${escapeHtml(data.ctaUrl || "#")}" style="margin-top:2rem;display:inline-block;border-radius:0.5rem;padding:0.75rem 2rem;font-size:0.875rem;font-weight:600;color:#fff;background:${escapeHtml(theme.primary)};text-decoration:none">${escapeHtml(data.ctaText)}</a>`
    : "";

  return `<section style="position:relative;display:flex;min-height:70vh;align-items:center;justify-content:center;text-align:center;${bgStyle}">
  ${overlay}
  <div style="position:relative;z-index:10;max-width:48rem;margin:0 auto;padding:0 1.5rem">
    <h1 style="font-size:3rem;font-weight:700;line-height:1.1">${escapeHtml(data.heading)}</h1>
    <p style="margin-top:1rem;font-size:1.125rem;opacity:0.8">${escapeHtml(data.subheading)}</p>
    ${cta}
  </div>
</section>`;
}

function renderCards(data: CardsData, theme: ThemeColors): string {
  const title = data.title
    ? `<h2 style="margin-bottom:2.5rem;text-align:center;font-size:1.875rem;font-weight:700">${escapeHtml(data.title)}</h2>`
    : "";

  const cards = data.cards
    .map((card) => {
      const iconSvg = cardIconMap[card.icon] || icons.zap;
      return `<div style="border-radius:0.5rem;padding:1.5rem;background:${escapeHtml(theme.primary)}15">
      <div style="color:${escapeHtml(theme.primary)}">${iconSvg}</div>
      <h3 style="margin-top:1rem;font-size:1.125rem;font-weight:600">${escapeHtml(card.title)}</h3>
      <p style="margin-top:0.5rem;font-size:0.875rem;opacity:0.7">${escapeHtml(card.description)}</p>
    </div>`;
    })
    .join("\n");

  return `<section style="max-width:64rem;margin:0 auto;padding:5rem 1.5rem">
  ${title}
  <div style="display:grid;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">
    ${cards}
  </div>
</section>`;
}

function renderText(data: TextData, theme: ThemeColors): string {
  const imageFirst = data.imagePosition === "left";
  const img = data.image
    ? `<img src="${escapeHtml(data.image)}" alt="${escapeHtml(data.heading)}" style="width:16rem;height:16rem;border-radius:0.5rem;object-fit:cover;flex-shrink:0"/>`
    : "";
  const textAlign = data.image ? "" : "max-width:48rem;margin:0 auto;text-align:center;";

  const textBlock = `<div style="${textAlign}">
    <h2 style="font-size:1.875rem;font-weight:700">${escapeHtml(data.heading)}</h2>
    <p style="margin-top:1rem;line-height:1.7;opacity:0.8;white-space:pre-line">${escapeHtml(data.body)}</p>
  </div>`;

  const content = data.image
    ? imageFirst
      ? `${img}${textBlock}`
      : `${textBlock}${img}`
    : textBlock;

  return `<section style="max-width:64rem;margin:0 auto;padding:5rem 1.5rem">
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3rem;justify-content:center">
    ${content}
  </div>
</section>`;
}

function renderGallery(data: GalleryData): string {
  if (data.images.length === 0) return "";

  const imgs = data.images
    .map(
      (img) =>
        `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}" style="width:100%;height:12rem;border-radius:0.5rem;object-fit:cover"/>`,
    )
    .join("\n");

  return `<section style="max-width:64rem;margin:0 auto;padding:4rem 1.5rem">
  <h2 style="text-align:center;font-size:1.875rem;font-weight:700">Gallery</h2>
  <div style="margin-top:2rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
    ${imgs}
  </div>
</section>`;
}

function renderContact(data: ContactData, theme: ThemeColors): string {
  const items: { icon: string; value: string }[] = [
    { icon: icons.mail, value: data.email },
    { icon: icons.phone, value: data.phone },
    { icon: icons.mapPin, value: data.address },
    { icon: icons.clock, value: data.hours },
  ].filter((item) => item.value);

  const rows = items
    .map(
      (item) =>
        `<div style="display:flex;align-items:center;gap:0.75rem">
      <span style="color:${escapeHtml(theme.primary)};flex-shrink:0">${item.icon}</span>
      <span style="font-size:0.875rem">${escapeHtml(item.value)}</span>
    </div>`,
    )
    .join("\n");

  return `<section style="border-top:1px solid ${escapeHtml(theme.text)}20;padding:4rem 0">
  <div style="max-width:64rem;margin:0 auto;padding:0 1.5rem">
    <h2 style="font-size:1.5rem;font-weight:700">Contact</h2>
    <div style="margin-top:1.5rem;display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">
      ${rows}
    </div>
  </div>
</section>`;
}

function renderMenu(data: MenuData, theme: ThemeColors): string {
  const categories = data.categories
    .map((cat) => {
      const items = cat.items
        .map(
          (item) =>
            `<div style="display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid ${escapeHtml(theme.text)}15;padding-bottom:0.75rem">
        <div>
          <p style="font-weight:500">${escapeHtml(item.name)}</p>
          <p style="font-size:0.875rem;opacity:0.6">${escapeHtml(item.description)}</p>
        </div>
        <span style="margin-left:1rem;white-space:nowrap;font-weight:600;color:${escapeHtml(theme.primary)}">${escapeHtml(item.price)}</span>
      </div>`,
        )
        .join("\n");

      return `<div>
      <h3 style="font-size:1.25rem;font-weight:600;color:${escapeHtml(theme.primary)}">${escapeHtml(cat.name)}</h3>
      <div style="margin-top:1rem;display:flex;flex-direction:column;gap:1rem">
        ${items}
      </div>
    </div>`;
    })
    .join("\n");

  return `<section style="max-width:56rem;margin:0 auto;padding:5rem 1.5rem">
  <h2 style="text-align:center;font-size:1.875rem;font-weight:700">Our Menu</h2>
  <div style="margin-top:3rem;display:flex;flex-direction:column;gap:3rem">
    ${categories}
  </div>
</section>`;
}

function renderPricing(data: PricingData, theme: ThemeColors): string {
  const plans = data.plans
    .map((plan) => {
      const features = plan.features
        .map(
          (f) =>
            `<li style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem">
        <span style="color:${escapeHtml(theme.primary)};flex-shrink:0">${icons.check}</span>
        ${escapeHtml(f)}
      </li>`,
        )
        .join("\n");

      const borderColor = plan.highlighted ? theme.primary : `${theme.text}20`;
      const bgColor = plan.highlighted ? `${theme.primary}10` : "transparent";
      const interval = plan.interval
        ? `<span style="margin-left:0.25rem;font-size:0.875rem;opacity:0.6">/${escapeHtml(plan.interval)}</span>`
        : "";

      return `<div style="display:flex;flex-direction:column;border-radius:0.5rem;border:1px solid ${escapeHtml(borderColor)};padding:1.5rem;background:${escapeHtml(bgColor)}">
      <h3 style="font-size:1.125rem;font-weight:600">${escapeHtml(plan.name)}</h3>
      <div style="margin-top:0.5rem">
        <span style="font-size:1.875rem;font-weight:700">${escapeHtml(plan.price)}</span>
        ${interval}
      </div>
      <ul style="margin-top:1.5rem;flex:1;list-style:none;padding:0;display:flex;flex-direction:column;gap:0.5rem">
        ${features}
      </ul>
    </div>`;
    })
    .join("\n");

  return `<section style="max-width:64rem;margin:0 auto;padding:5rem 1.5rem">
  <h2 style="margin-bottom:3rem;text-align:center;font-size:1.875rem;font-weight:700">Pricing</h2>
  <div style="display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">
    ${plans}
  </div>
</section>`;
}

function renderBlock(block: Block, theme: ThemeColors): string {
  switch (block.type) {
    case "hero":
      return renderHero(block.data, theme);
    case "cards":
      return renderCards(block.data, theme);
    case "text":
      return renderText(block.data, theme);
    case "gallery":
      return renderGallery(block.data);
    case "contact":
      return renderContact(block.data, theme);
    case "menu":
      return renderMenu(block.data, theme);
    case "pricing":
      return renderPricing(block.data, theme);
  }
}

export function generateSiteHtml(
  content: SiteContent,
  domainName: string,
): string {
  const { theme, blocks } = content;
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const body = sorted.map((block) => renderBlock(block, theme)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(domainName)}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      color:${escapeHtml(theme.text)};background:${escapeHtml(theme.background)};
      line-height:1.5;-webkit-font-smoothing:antialiased}
    img{max-width:100%;display:block}
    a{color:inherit}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
