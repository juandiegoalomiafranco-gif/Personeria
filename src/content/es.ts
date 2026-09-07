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
    menu: "Menú",
    closeMenu: "Cerrar",
  },

  hero: {
    headline: ["Mauro &", "Juan Diego"],
    meta: ["Personería 2026-2027", "Fórmula estudiantil", "Colegio Colombo Británico"],
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

  activities: {
    title: "Lo que nos formó",
    items: [
      {
        id: "casas",
        label: "Las casas",
        reflection:
          "Las cuatro casas —Canning, Ferguson, O'Leary y Rooke— compiten todo el año, y ahí se aprende que se gana por lo que hace el grupo, no por lo que hace uno. Mauro es capitán de Rooke.",
        image: {
          src: "/images/actividades/casas.jpg",
          alt: "Estudiantes junto al estandarte de la casa Rooke",
        },
      },
      {
        id: "rugby",
        label: "Rugby",
        reflection:
          "El rugby nos enseñó a levantarnos después de cada caída y a cuidar al que tenemos al lado — ahí no se avanza solo.",
        image: {
          src: "/images/actividades/rugby.jpg",
          alt: "Equipo de rugby del colegio con el balón, frente al muro de CCB Sports",
        },
      },
      {
        id: "futbol",
        label: "Fútbol",
        reflection:
          "El fútbol nos enseñó a leer una jugada entre varios y a cambiar el plan a mitad de partido sin dejar de confiar en el equipo.",
        image: {
          src: "/images/actividades/futbol.jpg",
          alt: "Equipo de fútbol con medallas y trofeo en la cancha",
        },
      },
      {
        id: "musical",
        label: "El musical",
        reflection:
          "El musical nos enseñó que un buen resultado no se improvisa: se ensaya, se corrige y se sostiene aunque los nervios digan lo contrario.",
        image: {
          src: "/images/actividades/musical.jpg",
          alt: "Escena del musical del colegio en tarima",
        },
      },
      {
        id: "musica",
        label: "La música",
        reflection:
          "Tocar en vivo nos enseñó a escuchar antes de entrar: una banda no suena por lo que toca cada uno, sino por cómo se oyen entre todos.",
        image: {
          src: "/images/actividades/musica.jpg",
          alt: "La banda tocando en vivo: batería y guitarra en tarima",
        },
      },
      {
        id: "onu",
        label: "Modelo ONU",
        reflection:
          "El Modelo ONU nos enseñó a defender una postura sin dejar de escuchar la del otro — y que negociar bien es la única forma real de mover algo.",
        image: {
          src: "/images/actividades/onu.jpg",
          alt: "Delegados del colegio en el Modelo ONU",
        },
      },
      {
        id: "servicio",
        label: "Servicio social",
        reflection:
          "El voluntariado nos enseñó que ayudar no es aparecer un día con una caja: es volver, acordarse de los nombres y sostener lo que uno prometió.",
        image: {
          src: "/images/actividades/servicio.jpg",
          alt: "Voluntariado con niños en una jornada de Soñar Despierto",
        },
      },
    ],
    closing: [
      [
        "Ninguna de estas actividades nos regaló nada: cada una nos hizo caer, corregir y volver a intentarlo — con otros, no solos. Eso es lo que nos formó para este momento.",
      ],
      [
        "Sabemos cómo funciona la Personería: tenemos voz, no voto, en el consejo directivo y en el comité de convivencia. No es una excusa — es exactamente por lo que necesitan a alguien que use esa voz a fondo. No prometemos decidir por ustedes; prometemos representarlos y defenderlos en cada espacio donde se hable de lo que les importa.",
      ],
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
    headline: ["Tu voz.", "Tus ideas.", "Nuestro cambio."],
    type3d: "Tu Voz",
    email: "hola@personeria2026.co",
    copyright: "PERSONERÍA (C) 2026",
  },

  chrome: {
    skipToContent: "Saltar al contenido",
    localeToggleLabel: "Cambiar idioma",
  },
};
