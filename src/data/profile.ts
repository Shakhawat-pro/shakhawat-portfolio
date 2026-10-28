// All personal content lives here. Items marked TODO are placeholders.

export const profile = {
  firstName: "Shakhawat",
  lastName: "Hossain",
  fullName: "MD. Shakhawat Hossain",
  role: "Full-Stack Developer",
  location: "Dhaka, Bangladesh",
  tagline:
    "Full-Stack Developer building modern web applications — focused on clean code, performance, responsive interfaces and reliable user experiences.",
  about: [
    "I'm Shakhawat — a full-stack developer who enjoys turning complex business problems into fast, friendly products. By day I build ERP modules, e-commerce platforms and dashboards at Nebs-IT Solution.",
    "I care about the details: clean APIs, smooth interactions and interfaces that feel good on every screen. Always learning, always shipping.",
  ],
  photo: "/Shakhawat_img.png",
  resume: "/Shakhawat_Hossain_Resume.docx.pdf",
  email: "shakhawat.dev.pro@gmail.com",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/in/shakhawat-dev-pro" },
    { label: "GitHub", href: "https://github.com/Shakhawat-pro" }, // TODO: confirm GitHub URL
    { label: "Instagram", href: "#" }, // TODO: add Instagram URL
  ],
  // TODO: replace with real numbers
  stats: [
    { value: 1, suffix: "+", label: "Years building" },
    { value: 10, suffix: "+", label: "Projects shipped" },
    { value: 15, suffix: "+", label: "Technologies" },
    { value: 2025, suffix: "", label: "Diploma in CST" },
  ],
  ticker: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "MongoDB",
    "MySQL",
    "Redis",
    "Prisma",
    "GSAP",
    "Tailwind CSS",
    "REST APIs",
  ],
};

export const experience = [
  {
    period: "Jul 2025 — Present",
    title: "Full-Stack Developer",
    org: "Nebs-IT Solution LTD",
    place: "Dhaka, Bangladesh",
    points: [
      "Develop and maintain the company ERP — inventory, sales, purchase, HR and reporting — with React, Node.js, Express and MySQL.",
      "Build and integrate REST APIs and third-party services like payment gateways and email.",
      "Ship client work: e-commerce sites, dashboards and internal tools.",
      "Code reviews, debugging and deployments with Git and Vercel.",
    ],
  },
  {
    period: "Graduation · Dec 2025",
    title: "Diploma in Computer Science & Technology",
    org: "Daffodil Polytechnic Institute",
    place: "Dhaka, Bangladesh",
    points: ["Languages: English (Professional) · Bangla (Native)"],
  },
];

export type Project = {
  name: string;
  kind: string;
  description: string;
  tags: string[];
  hue: [string, string];
  art: "erp" | "shop" | "motion";
  live?: string;
  repo?: string;
};

export const projects: Project[] = [
  {
    name: "Nebs-IT ERP",
    kind: "Enterprise system",
    description:
      "A complete ERP for inventory, sales, purchase, HR and reporting — with role-based access, real-time dashboards, payment gateway and automated emails.",
    tags: ["React", "Node.js", "Express", "MongoDB", "Prisma"],
    hue: ["#7c3aed", "#22d3ee"],
    art: "erp",
    live: "#", // TODO
  },
  {
    name: "Multi-Branch Commerce",
    kind: "E-commerce + POS",
    description:
      "An e-commerce platform for a business with many branches — separate inventories, orders and customers per branch, plus an integrated in-store POS.",
    tags: ["Next.js", "Node.js", "Express", "MongoDB"],
    hue: ["#db2777", "#8b5cf6"],
    art: "shop",
    live: "#", // TODO
  },
  {
    name: "Animated Portfolio",
    kind: "Creative front-end",
    description:
      "A personal portfolio with smooth scrolling and interactive motion built with GSAP and Framer Motion, responsive across every device.",
    tags: ["React", "GSAP", "Tailwind CSS"],
    hue: ["#f97316", "#6366f1"],
    art: "motion",
    live: "#", // TODO
  },
];

export const toolkit = [
  {
    word: "FRONTEND",
    label: "Frontend",
    blurb: "Interfaces that feel fast, fluid and alive on every screen.",
    items: ["React.js", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "GSAP", "Framer Motion"],
  },
  {
    word: "BACKEND",
    label: "Backend",
    blurb: "Secure, well-structured APIs and the business logic behind them.",
    items: ["Node.js", "Express.js", "REST APIs", "Auth & RBAC", "Payment Gateways"],
  },
  {
    word: "DATABASE",
    label: "Database",
    blurb: "Modeling, querying and caching data that has to stay right.",
    items: ["MongoDB", "Mongoose", "MySQL", "Redis", "Prisma"],
  },
  {
    word: "TOOLS",
    label: "Tools",
    blurb: "The workflow that takes code from my editor to production.",
    items: ["Git", "VS Code", "Postman", "Vercel", "Netlify", "Firebase"],
  },
];
