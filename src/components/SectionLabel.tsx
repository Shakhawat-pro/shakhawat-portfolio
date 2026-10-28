export default function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p data-reveal className="label mb-6 flex items-center gap-3">
      <span className="text-cyan">{"//"}</span>
      <span className="text-violet">{index}</span>
      <span className="h-px w-10 bg-line" />
      {children}
    </p>
  );
}
