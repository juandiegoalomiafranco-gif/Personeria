import type { SiteContent } from "./schema";

/**
 * Copy en español. Por ahora es placeholder con la misma forma y longitud que la
 * referencia — cuando llegue el contenido real de la campaña, se reemplaza aquí
 * y el sitio entero se actualiza solo.
 */
export const es: SiteContent = {
  meta: {
    title: "PERSONERÍA©2026",
    description: "Campaña a la Personería Estudiantil © 2026",
  },

  brand: {
    name: "mauro & juan diego",
    short: "m & jd",
  },

  nav: {
    work: "Propuestas",
    contact: "Contacto",
    theme: "Tema",
    menu: "Menú",
    closeMenu: "Cerrar",
    sound: "Sonido",
  },

  hero: {
    headline: ["Mauro &", "Juan Diego"],
    meta: ["Personería 2026-2027", "Fórmula estudiantil", "CCB"],
    scrollHint: "Desliza para ver la propuesta",
  },

  manifesto: {
    image: {
      src: "/images/portrait.png",
      alt: "Retrato del candidato",
    },
    primary: [
      "Exploro cómo convertir las quejas de pasillo en decisiones concretas, construyendo la próxima generación de acuerdos estudiantiles.",
    ],
    secondary: [
      "Estoy construyendo ",
      { text: "propuestas™", href: "#propuestas" },
      ", y antes trabajé en el consejo estudiantil, en el comité de convivencia y en el periódico del colegio.",
    ],
  },

  work: {
    title: "Propuestas",
    items: [
      { id: "p1", title: "Ruta de reclamos", period: "2026", tag: "Propuesta", href: "#p1" },
      { id: "p2", title: "Semana de bienestar", period: "2026", tag: "Propuesta", href: "#p2" },
      { id: "p3", title: "Espacios de estudio", period: "2026", tag: "Propuesta", href: "#p3" },
      {
        id: "p4",
        title: "Comité de cafetería",
        period: "2026",
        tag: "Propuesta",
        href: "#p4",
        external: true,
        externalLabel: "detalle",
      },
      {
        id: "p5",
        title: "Buzón anónimo",
        period: "2026",
        tag: "Propuesta",
        href: "#p5",
        external: true,
        externalLabel: "detalle",
      },
      { id: "p6", title: "Torneo intercursos", period: "2025-2026", href: "#p6" },
      { id: "p7", title: "Tutorías entre pares", period: "2025", href: "#p7" },
      { id: "p8", title: "Reciclaje por sede", period: "2024-2025", href: "#p8" },
      {
        id: "p9",
        title: "Feria de talentos",
        period: "2025",
        href: "#p9",
        external: true,
        externalLabel: "evento",
      },
      {
        id: "p10",
        title: "Jornada de donación",
        period: "2024",
        href: "#p10",
        external: true,
        externalLabel: "evento",
      },
    ],
  },

  story: {
    chapters: [
      ["Somos Mauro", "y Juan Diego,", "y nos cansamos", "de esperar"],
      ["a que alguien", "arreglara lo que", "todos comentamos", "en el pasillo,"],
      ["así que dejamos", "de quejarnos", "y escribimos", "lo que sí se puede:"],
      ["propuestas", "con fecha,", "con responsable", "y con cómo medirlas."],
    ],
  },

  contact: {
    headline: ["Vamos a", "Crear", "algo", "extraordinario"],
    type3d: "Tu Voz",
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
    skipToContent: "Saltar al contenido",
    localeToggleLabel: "Cambiar idioma",
  },
};
