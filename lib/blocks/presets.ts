import type { SiteContent, PresetType } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function businessPreset(): SiteContent {
  return {
    theme: { primary: "#3b82f6", background: "#0f172a", text: "#f8fafc" },
    blocks: [
      {
        id: uid(), type: "hero", order: 0,
        data: {
          heading: "Grow Your Business Online",
          subheading: "We help companies build a strong digital presence with modern solutions.",
          ctaText: "Get Started",
          ctaUrl: "#",
          bgImage: "",
        },
      },
      {
        id: uid(), type: "cards", order: 1,
        data: {
          title: "What We Offer",
          cards: [
            { icon: "Zap", title: "Fast Performance", description: "Lightning-fast load times that keep your visitors engaged." },
            { icon: "Shield", title: "Secure & Reliable", description: "Enterprise-grade security to protect your data and customers." },
            { icon: "BarChart", title: "Analytics Built In", description: "Track your growth with powerful, easy-to-use analytics." },
          ],
        },
      },
      {
        id: uid(), type: "text", order: 2,
        data: {
          heading: "About Us",
          body: "We are a team of passionate professionals dedicated to helping businesses thrive in the digital world. With years of experience, we deliver solutions that drive real results.",
          image: "",
          imagePosition: "right",
        },
      },
      {
        id: uid(), type: "contact", order: 3,
        data: {
          email: "hello@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Business Ave, Suite 100, New York, NY 10001",
          hours: "Mon-Fri 9am-5pm",
        },
      },
    ],
  };
}

export function portfolioPreset(): SiteContent {
  return {
    theme: { primary: "#8b5cf6", background: "#1a1a2e", text: "#e2e8f0" },
    blocks: [
      {
        id: uid(), type: "hero", order: 0,
        data: {
          heading: "Jane Doe",
          subheading: "Full-Stack Developer & Designer. I craft beautiful, performant web experiences.",
          ctaText: "View My Work",
          ctaUrl: "#",
          bgImage: "",
        },
      },
      {
        id: uid(), type: "cards", order: 1,
        data: {
          title: "Projects",
          cards: [
            { icon: "Code", title: "E-Commerce Platform", description: "A modern shopping experience built with Next.js and Stripe." },
            { icon: "Layout", title: "Task Management App", description: "A collaborative project management tool with real-time updates." },
            { icon: "Image", title: "Portfolio Website", description: "A creative portfolio showcasing photography and design work." },
          ],
        },
      },
      {
        id: uid(), type: "text", order: 2,
        data: {
          heading: "About Me",
          body: "With over 5 years of experience in web development, I specialize in building modern, accessible, and performant applications. I love turning complex problems into simple, elegant solutions.",
          image: "",
          imagePosition: "left",
        },
      },
      {
        id: uid(), type: "contact", order: 3,
        data: {
          email: "jane@example.com",
          phone: "",
          address: "",
          hours: "",
        },
      },
    ],
  };
}

export function restaurantPreset(): SiteContent {
  return {
    theme: { primary: "#d97706", background: "#1c1917", text: "#fafaf9" },
    blocks: [
      {
        id: uid(), type: "hero", order: 0,
        data: {
          heading: "La Bella Cucina",
          subheading: "Authentic Italian cuisine made with love and tradition.",
          ctaText: "View Menu",
          ctaUrl: "#",
          bgImage: "",
        },
      },
      {
        id: uid(), type: "menu", order: 1,
        data: {
          categories: [
            {
              name: "Appetizers",
              items: [
                { name: "Bruschetta", description: "Toasted bread with fresh tomatoes, garlic, and basil", price: "$12" },
                { name: "Caprese Salad", description: "Fresh mozzarella, tomatoes, and basil with balsamic glaze", price: "$14" },
              ],
            },
            {
              name: "Main Courses",
              items: [
                { name: "Spaghetti Carbonara", description: "Classic Roman pasta with pancetta, egg, and pecorino", price: "$22" },
                { name: "Osso Buco", description: "Braised veal shanks with gremolata and saffron risotto", price: "$34" },
              ],
            },
            {
              name: "Desserts",
              items: [
                { name: "Tiramisu", description: "Classic Italian coffee-flavored dessert", price: "$10" },
                { name: "Panna Cotta", description: "Vanilla bean cream with seasonal berries", price: "$10" },
              ],
            },
          ],
        },
      },
      {
        id: uid(), type: "gallery", order: 2,
        data: { images: [] },
      },
      {
        id: uid(), type: "contact", order: 3,
        data: {
          address: "456 Culinary Blvd, San Francisco, CA 94102",
          phone: "+1 (555) 987-6543",
          email: "",
          hours: "Mon-Thu 11am-10pm | Fri-Sat 11am-11pm | Sun 10am-9pm",
        },
      },
    ],
  };
}

export const presetFactories: Record<PresetType, () => SiteContent> = {
  business: businessPreset,
  portfolio: portfolioPreset,
  restaurant: restaurantPreset,
};
