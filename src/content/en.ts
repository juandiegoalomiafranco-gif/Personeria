import type { SiteContent } from "./schema";

/** Copy en inglés. Debe mantenerse en paridad estructural con `es.ts`. */
export const en: SiteContent = {
  meta: {
    title: "PERSONERÍA©2026",
    description: "Student Representative Campaign © 2026",
  },

  brand: {
    name: "mauro & juan diego",
    short: "m & jd",
  },

  nav: {
    work: "Platform",
    contact: "Contact",
    menu: "Menu",
    closeMenu: "Close",
  },

  hero: {
    headline: ["Mauro &", "Juan Diego"],
    meta: ["Student Representative 2026-2027", "Joint ticket", "Colegio Colombo Británico"],
    scrollHint: "Scroll to see the platform",
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

  activities: {
    title: "What shaped us",
    items: [
      {
        id: "casas",
        label: "The houses",
        reflection:
          "The four houses —Canning, Ferguson, O'Leary and Rooke— compete all year long, and that's where you learn that you win by what the group does, not by what one person does. Mauro captains Rooke.",
        image: {
          src: "/images/actividades/casas.jpg",
          alt: "Students beside the Rooke house banner",
        },
      },
      {
        id: "rugby",
        label: "Rugby",
        reflection:
          "Rugby taught us to get back up after every hit and look out for the person next to you — nobody moves forward alone there.",
        image: {
          src: "/images/actividades/rugby.jpg",
          alt: "The school rugby team with the ball, in front of the CCB Sports wall",
        },
      },
      {
        id: "futbol",
        label: "Soccer",
        reflection:
          "Soccer taught us to read a play together and change the plan mid-match without losing trust in the team.",
        image: {
          src: "/images/actividades/futbol.jpg",
          alt: "Soccer team with medals and a trophy on the field",
        },
      },
      {
        id: "musical",
        label: "The musical",
        reflection:
          "The musical taught us that a good result isn't improvised: you rehearse, you correct, and you hold it together even when your nerves say otherwise.",
        image: {
          src: "/images/actividades/musical.jpg",
          alt: "A scene from the school musical on stage",
        },
      },
      {
        id: "musica",
        label: "Music",
        reflection:
          "Playing live taught us to listen before coming in: a band doesn't sound good because of what each person plays, but because of how they hear each other.",
        image: {
          src: "/images/actividades/musica.jpg",
          alt: "The band playing live: drums and guitar on stage",
        },
      },
      {
        id: "onu",
        label: "Model UN",
        reflection:
          "Model UN taught us to defend a position without ever stopping listening to the other side — and that real negotiation is the only way to actually move something forward.",
        image: {
          src: "/images/actividades/onu.jpg",
          alt: "School delegates at Model UN",
        },
      },
      {
        id: "servicio",
        label: "Community service",
        reflection:
          "Volunteering taught us that helping isn't showing up once with a box: it's coming back, remembering names, and holding up what you promised.",
        image: {
          src: "/images/actividades/servicio.jpg",
          alt: "Volunteering with children at a Soñar Despierto day",
        },
      },
    ],
    closing: [
      [
        "None of these activities handed us anything: each one made us fall, adjust, and try again — with others, never alone. That's what shaped us for this moment.",
      ],
      [
        "We know how the Personería works: we have voice, not vote, on the school board and the coexistence committee. That's not an excuse — it's exactly why you need someone who'll use every bit of that voice. We're not promising to decide for you; we're promising to represent you and advocate for you in every space where what matters to you gets discussed.",
      ],
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

  story: {
    chapters: [
      ["We're Mauro", "and Juan Diego,", "and we got tired", "of waiting"],
      ["for someone else", "to fix what we all", "complain about", "in the hallway,"],
      ["so we stopped", "complaining", "and wrote down", "what can be done:"],
      ["proposals,", "with a date,", "a name on them,", "and a way to check."],
    ],
  },

  contact: {
    headline: ["Your voice.", "Your ideas.", "Our change."],
    type3d: "Your Voice",
    email: "hola@personeria2026.co",
    copyright: "PERSONERÍA (C) 2026",
  },

  chrome: {
    skipToContent: "Skip to content",
    localeToggleLabel: "Switch language",
  },
};
