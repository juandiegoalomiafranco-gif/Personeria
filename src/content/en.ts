import type { SiteContent } from "./schema";

/** Copy en inglés. Debe mantenerse en paridad estructural con `es.ts`. */
export const en: SiteContent = {
  meta: {
    title: "PERSONERÍA©2026",
    description: "Student Representative Campaign © 2026",
  },

  brand: {
    name: "personería",
    suffix: ".2026",
  },

  nav: {
    work: "Platform",
    contact: "Contact",
    theme: "Theme",
    menu: "Menu",
    closeMenu: "Close",
    sound: "Sound",
  },

  hero: {
    eyebrow: ["Listen &", "Resolve"],
    tagline: "Thinking in systems. Building with care.",
    intro: [
      "I'm running for Student Representative because school works better when someone takes the small problems seriously. Outside of class I build tools that make things move faster.",
    ],
    headline: ["I bring", "craft & judgment", "to representation"],
    type3d: "PERSONERÍA",
  },

  manifesto: {
    image: {
      src: "/images/portrait.png",
      alt: "Portrait of the candidate",
    },
    primary: [
      "I explore how to turn hallway complaints into concrete decisions, building the next generation of student agreements.",
    ],
    secondary: [
      "I'm building ",
      { text: "the platform™", href: "#propuestas" },
      ", and previously worked on the student council, the coexistence committee, and the school paper.",
    ],
  },

  work: {
    title: "Platform",
    items: [
      { id: "p1", title: "Complaint pipeline", period: "2026", tag: "Proposal", href: "#p1" },
      { id: "p2", title: "Wellbeing week", period: "2026", tag: "Proposal", href: "#p2" },
      { id: "p3", title: "Study spaces", period: "2026", tag: "Proposal", href: "#p3" },
      {
        id: "p4",
        title: "Cafeteria committee",
        period: "2026",
        tag: "Proposal",
        href: "#p4",
        external: true,
        externalLabel: "detail",
      },
      {
        id: "p5",
        title: "Anonymous inbox",
        period: "2026",
        tag: "Proposal",
        href: "#p5",
        external: true,
        externalLabel: "detail",
      },
      { id: "p6", title: "Inter-grade tournament", period: "2025-2026", href: "#p6" },
      { id: "p7", title: "Peer tutoring", period: "2025", href: "#p7" },
      { id: "p8", title: "Per-campus recycling", period: "2024-2025", href: "#p8" },
      {
        id: "p9",
        title: "Talent fair",
        period: "2025",
        href: "#p9",
        external: true,
        externalLabel: "event",
      },
      {
        id: "p10",
        title: "Donation drive",
        period: "2024",
        href: "#p10",
        external: true,
        externalLabel: "event",
      },
    ],
  },

  tunnel: {
    statements: [
      ["Represent", "with", "purpose"],
      ["Represent", "with a", "human touch"],
      ["Students", "first"],
    ],
    phrases: [
      "Building agreements that last.",
      "Independent by design and conviction.",
      "Clarity first. Noise second.",
      "Ship in small steps. Aim for long arcs.",
    ],
  },

  contact: {
    headline: ["Let's", "Build", "something", "extraordinary"],
    type3d: "YOUR VOICE",
    email: "hola@personeria2026.co",
    socials: [
      { id: "instagram", label: "Instagram", href: "#" },
      { id: "tiktok", label: "TikTok", href: "#" },
      { id: "whatsapp", label: "WhatsApp", href: "#" },
    ],
    copyright: "PERSONERÍA (C) 2026",
  },

  chrome: {
    timezoneLabel: "GMT-5 CO",
    weather: { latitude: 4.711, longitude: -74.0721 },
    skipToContent: "Skip to content",
    localeToggleLabel: "Switch language",
  },
};
