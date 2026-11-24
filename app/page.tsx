
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [noteName, setNoteName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const openNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = noteName.trim();

    if (!name) {
      setError('Please enter a notepad name.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError('Use only letters, numbers, hyphens and underscores.');
      return;
    }

    router.push(`/${encodeURIComponent(name)}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#171717] px-5 text-[#E5E5E5]">
      <div className="w-full max-w-xl">

        {/* Branding */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Death<span className="text-[#B8A6A0]">Note</span>
          </h1>

          <p className="mt-4 text-sm text-[#888888] sm:text-base">
            Because apparently, you can't remember shit.
          </p>
        </header>

        {/* Notepad Form */}
        <form onSubmit={openNote} className="space-y-4">
          <input
            type="text"
            value={noteName}
            onChange={(e) => {
              setNoteName(e.target.value);
              setError('');
            }}
            placeholder="What are we forgetting today?"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-[#383838] bg-[#202020] px-5 py-4 text-base text-white outline-none transition placeholder:text-[#666666] focus:border-[#777777]"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#E5E5E5] py-4 text-sm font-semibold text-[#171717] transition hover:bg-white"
          >
            Go!
          </button>
        </form>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-[#777777]">
            No login required
          </p>
        </footer>

      </div>
    </main>
  );
}
