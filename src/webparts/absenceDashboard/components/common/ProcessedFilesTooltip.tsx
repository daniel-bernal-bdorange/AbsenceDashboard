import { useState, type ReactElement } from 'react';

import { useAppStore } from '../../store/useAppStore';

export function ProcessedFilesTooltip(): ReactElement | null {
  const processedFileNotes = useAppStore((state) => state.processedFileNotes);
  const [isOpen, setIsOpen] = useState(false);

  if (processedFileNotes.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="group relative">
        <button
          type="button"
          aria-label="Ver archivos procesados"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-xs font-semibold text-gray-500 shadow-sm backdrop-blur transition hover:border-orangeBusiness/40 hover:text-orangeBusiness focus:outline-none focus:ring-2 focus:ring-orangeBusiness/30"
        >
          i
        </button>

        <div
          className={`absolute bottom-12 right-0 w-[320px] max-w-[85vw] rounded-2xl border border-gray-200 bg-white/95 p-4 text-left shadow-xl backdrop-blur transition duration-150 ${
            isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Archivos procesados
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-gray-600">
            {processedFileNotes.map((note) => (
              <li key={note} className="rounded-lg bg-gray-50 px-3 py-2">
                {note}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-gray-400">
            Pulsa el icono para fijarlo en pantalla.
          </p>
        </div>
      </div>
    </div>
  );
}