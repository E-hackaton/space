import { drive } from '../../world/state';

/** Commandes tactiles (téléphones et tablettes) : mêmes effets que les flèches du clavier. */
export function TouchPad({ className = 'bottom-24' }: { className?: string }) {
  const btn = (key: keyof typeof drive, label: string, aria: string) => (
    <button
      type="button"
      aria-label={aria}
      className="pointer-events-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl text-white ring-1 ring-white/30 backdrop-blur active:bg-white/35"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drive[key] = 1;
      }}
      onPointerUp={() => (drive[key] = 0)}
      onPointerCancel={() => (drive[key] = 0)}
    >
      {label}
    </button>
  );
  return (
    <div className={`pointer-events-none absolute inset-x-0 z-30 flex justify-between px-4 sm:hidden ${className}`}>
      <div className="flex gap-2">
        {btn('left', '◀', '←')}
        {btn('right', '▶', '→')}
      </div>
      <div className="flex flex-col gap-2">
        {btn('forward', '▲', '↑')}
        {btn('back', '▼', '↓')}
      </div>
    </div>
  );
}
