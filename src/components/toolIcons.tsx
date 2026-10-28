import type { IconType } from "react-icons";
import {
  SiCss,
  SiExpress,
  SiFirebase,
  SiFramer,
  SiGit,
  SiGreensock,
  SiHtml5,
  SiJavascript,
  SiMongodb,
  SiMongoose,
  SiMysql,
  SiNetlify,
  SiNextdotjs,
  SiNodedotjs,
  SiPostman,
  SiPrisma,
  SiReact,
  SiRedis,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";
import { TbApi, TbCode, TbCreditCard, TbShieldLock } from "react-icons/tb";
import { VscVscode } from "react-icons/vsc";

// Brand colors; monochrome brands use near-white so they read on the dark theme.
const icons: Record<string, [IconType, string]> = {
  "React.js": [SiReact, "#61dafb"],
  "Next.js": [SiNextdotjs, "#f5f5f5"],
  TypeScript: [SiTypescript, "#3178c6"],
  JavaScript: [SiJavascript, "#f7df1e"],
  HTML5: [SiHtml5, "#e34f26"],
  CSS3: [SiCss, "#663399"],
  "Tailwind CSS": [SiTailwindcss, "#38bdf8"],
  GSAP: [SiGreensock, "#88ce02"],
  "Framer Motion": [SiFramer, "#e5e7eb"],
  "Node.js": [SiNodedotjs, "#5fa04e"],
  "Express.js": [SiExpress, "#f5f5f5"],
  "REST APIs": [TbApi, "#67e8f9"],
  "Auth & RBAC": [TbShieldLock, "#a78bfa"],
  "Payment Gateways": [TbCreditCard, "#fb923c"],
  MongoDB: [SiMongodb, "#47a248"],
  Mongoose: [SiMongoose, "#e8584a"],
  MySQL: [SiMysql, "#5b9bd5"],
  Redis: [SiRedis, "#ff4438"],
  Prisma: [SiPrisma, "#e5e7eb"],
  Git: [SiGit, "#f05032"],
  "VS Code": [VscVscode, "#22a6f2"],
  Postman: [SiPostman, "#ff6c37"],
  Vercel: [SiVercel, "#f5f5f5"],
  Netlify: [SiNetlify, "#00c7b7"],
  Firebase: [SiFirebase, "#ffca28"],
};

export function toolIcon(name: string): [IconType, string] {
  return icons[name] ?? [TbCode, "#67e8f9"];
}
