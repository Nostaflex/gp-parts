'use client';

import { useEffect, useState } from 'react';

function isOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const time = now.getHours() * 60 + now.getMinutes();

  if (day >= 1 && day <= 5) return time >= 450 && time < 1050; // lun-ven 7:30-17:30
  if (day === 6) return time >= 480 && time < 780; // sam 8:00-13:00
  return false;
}

export function CpOpenBadge() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen());
    const id = setInterval(() => setOpen(isOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
        open ? 'bg-cp-vert-l/20 text-cp-vert-l' : 'bg-red-500/20 text-red-400'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-cp-vert-l animate-pulse' : 'bg-red-400'}`}
      />
      {open ? 'Ouvert maintenant' : 'Fermé'}
    </span>
  );
}
