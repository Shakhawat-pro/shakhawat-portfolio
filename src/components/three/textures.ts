import * as THREE from "three";

const CYAN = "#67e8f9";
const VIOLET = "#a78bfa";
const DIM = "rgba(167,139,250,0.45)";

export function glowTexture(inner = "rgba(139,92,246,1)", outer = "rgba(139,92,246,0)") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function frame(g: CanvasRenderingContext2D, w: number, h: number, title: string) {
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "rgba(40,30,110,0.55)");
  bg.addColorStop(1, "rgba(8,20,50,0.35)");
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(4, 4, w - 8, h - 8, 18);
  g.fill();
  g.strokeStyle = "rgba(140,160,255,0.55)";
  g.lineWidth = 2;
  g.stroke();
  // corner brackets
  g.strokeStyle = CYAN;
  g.lineWidth = 3;
  const k = 22;
  [
    [10, 10, 1, 1],
    [w - 10, 10, -1, 1],
    [10, h - 10, 1, -1],
    [w - 10, h - 10, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    g.beginPath();
    g.moveTo(x, y + k * sy);
    g.lineTo(x, y);
    g.lineTo(x + k * sx, y);
    g.stroke();
  });
  g.font = "600 20px monospace";
  g.fillStyle = CYAN;
  g.fillText(title, 30, 44);
  ["#f472b6", "#facc15", "#4ade80"].forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath();
    g.arc(w - 40 - i * 22, 37, 6, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "rgba(140,160,255,0.25)";
  g.fillRect(24, 58, w - 48, 1.5);
}

export type PanelKind = "code" | "bars" | "terminal" | "api" | "stats" | "line";

export function panelTexture(kind: PanelKind) {
  const w = 512;
  const h = 320;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;

  if (kind === "code") {
    frame(g, w, h, "erp/inventory.ts");
    const lines: [string, string][] = [
      [VIOLET, "export async function restock("],
      ["#e0e7ff", "  branch: Branch, sku: string"],
      [VIOLET, ") {"],
      [CYAN, "  const item = await db.item"],
      ["#e0e7ff", "    .findUnique({ where: { sku } })"],
      [CYAN, "  if (item.qty < item.min)"],
      ["#f9a8d4", "    await notify(branch.manager)"],
      [VIOLET, "  return item"],
      [VIOLET, "}"],
    ];
    g.font = "19px monospace";
    lines.forEach(([col, t], i) => {
      g.fillStyle = DIM;
      g.fillText(String(i + 1).padStart(2, " "), 26, 92 + i * 25);
      g.fillStyle = col;
      g.fillText(t, 62, 92 + i * 25);
    });
  } else if (kind === "bars") {
    frame(g, w, h, "sales / branch");
    const vals = [0.45, 0.7, 0.38, 0.85, 0.6, 0.95, 0.72, 0.5];
    vals.forEach((v, i) => {
      const bh = v * 190;
      const x = 40 + i * 56;
      const grd = g.createLinearGradient(0, 290 - bh, 0, 290);
      grd.addColorStop(0, CYAN);
      grd.addColorStop(1, "rgba(139,92,246,0.4)");
      g.fillStyle = grd;
      g.fillRect(x, 290 - bh, 32, bh);
    });
  } else if (kind === "terminal") {
    frame(g, w, h, "~/portfolio — zsh");
    const lines = [
      [CYAN, "$ npm run build"],
      ["#e0e7ff", "✓ Compiled in 2.1s"],
      ["#e0e7ff", "✓ Generating static pages"],
      ["#4ade80", "✓ Ready"],
      [CYAN, "$ git push origin main"],
      [VIOLET, "→ deploying to vercel…"],
      ["#4ade80", "✓ Production: live"],
    ];
    g.font = "20px monospace";
    lines.forEach(([col, t], i) => {
      g.fillStyle = col;
      g.fillText(t, 30, 94 + i * 30);
    });
  } else if (kind === "api") {
    frame(g, w, h, "POST /api/orders  201");
    const lines = [
      [VIOLET, "{"],
      [CYAN, '  "id": "ord_8f3k2",'],
      [CYAN, '  "branch": "dhaka-02",'],
      ["#e0e7ff", '  "items": 3,'],
      ["#e0e7ff", '  "total": 4290,'],
      ["#4ade80", '  "status": "paid"'],
      [VIOLET, "}"],
    ];
    g.font = "20px monospace";
    lines.forEach(([col, t], i) => {
      g.fillStyle = col;
      g.fillText(t, 30, 94 + i * 30);
    });
  } else if (kind === "stats") {
    frame(g, w, h, "system.status");
    g.font = "bold 64px serif";
    g.fillStyle = "#ffffff";
    g.fillText("99.9%", 34, 150);
    g.font = "18px monospace";
    g.fillStyle = CYAN;
    g.fillText("UPTIME", 38, 180);
    g.lineWidth = 14;
    g.strokeStyle = "rgba(139,92,246,0.3)";
    g.beginPath();
    g.arc(390, 150, 62, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = CYAN;
    g.beginPath();
    g.arc(390, 150, 62, -Math.PI / 2, Math.PI * 1.15);
    g.stroke();
    g.font = "18px monospace";
    g.fillStyle = "#e0e7ff";
    g.fillText("API 42ms · DB OK · CACHE HIT", 34, 270);
  } else {
    frame(g, w, h, "traffic · 7d");
    g.strokeStyle = CYAN;
    g.lineWidth = 4;
    g.shadowColor = CYAN;
    g.shadowBlur = 12;
    g.beginPath();
    const pts = [0.7, 0.55, 0.62, 0.4, 0.48, 0.3, 0.36, 0.18];
    pts.forEach((v, i) => {
      const x = 40 + i * 62;
      const y = 80 + v * 200;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.stroke();
    g.shadowBlur = 0;
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
