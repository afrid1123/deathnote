
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '../../utils/supabase/client';

export default function NoteEditor({ room }: { room: string }) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  const [saveStatus, setSaveStatus] = useState('Loading...');

  const lastSavedRef = useRef('');
  const contentRef = useRef('');

  const supabase = useMemo(() => createClient(), []);

  const changeContent = (value: string) => {
    contentRef.current = value;
    setContent(value);
  };

  useEffect(() => {
    let active = true;

    setLoaded(false);
    setSaveStatus('Loading...');

    const loadNote = async () => {
      const { error: insertError } = await supabase
        .from('notes')
        .upsert(
          { room, content: '' },
          { onConflict: 'room', ignoreDuplicates: true }
        );

      if (insertError) {
        if (active) setSaveStatus('Could not connect');
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('content')
        .eq('room', room)
        .single();

      if (!active) return;

      if (error) {
        setSaveStatus('Could not load note');
        return;
      }

      const savedContent = data.content ?? '';

      lastSavedRef.current = savedContent;
      contentRef.current = savedContent;
      setContent(savedContent);
      setLoaded(true);
      setSaveStatus('All changes saved');
    };

    const channel = supabase
      .channel(`note-${room}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `room=eq.${room}`,
        },
        (payload) => {
          const updatedNote = payload.new as { content?: string };

          if (typeof updatedNote.content !== 'string') return;

          if (contentRef.current !== lastSavedRef.current) return;

          lastSavedRef.current = updatedNote.content;
          contentRef.current = updatedNote.content;
          setContent(updatedNote.content);
          setSaveStatus('All changes saved');
        }
      )
      .subscribe();

    loadNote();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [room, supabase]);

  useEffect(() => {
    if (!loaded || content === lastSavedRef.current) return;

    const contentToSave = content;

    setSaveStatus('Saving...');

    const timeout = window.setTimeout(async () => {
      const { error } = await supabase
        .from('notes')
        .update({
          content: contentToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('room', room);

      if (error) {
        setSaveStatus('Save failed');
        return;
      }

      lastSavedRef.current = contentToSave;

      if (contentRef.current === contentToSave) {
        setSaveStatus('All changes saved');
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [content, loaded, room, supabase]);

  const copyText = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied('text');
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied('link');
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  const clearText = () => {
    if (content && window.confirm('Are you sure you want to clear this notepad?')) {
      changeContent('');
    }
  };

  return (
    <main className="min-h-screen bg-[#171717] text-[#E5E5E5]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-[#333333] pb-4">
          <a href="/">
            <h1 className="text-2xl font-semibold tracking-tight">
              Death<span className="text-[#B8A6A0]">Note</span>
            </h1>
            <p className="mt-1 text-xs text-[#777777]">Your brain's backup plan.</p>
          </a>
          <span className="rounded-full border border-[#333333] px-3 py-1.5 text-xs text-[#888888]">
            Shared notepad
          </span>
        </header>

        <section className="flex flex-1 flex-col pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#777777]">
                Current notepad
              </p>
              <h2 className="mt-1.5 break-all text-lg font-medium">{room}</h2>
            </div>

            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg border border-[#383838] px-4 py-2 text-sm text-[#BBBBBB] transition hover:border-[#777777] hover:text-white"
            >
              {copied === 'link' ? 'Copied!' : 'Share link'}
            </button>
          </div>

          <div className="flex min-h-[75vh] flex-1 flex-col overflow-hidden rounded-xl border border-[#333333] bg-[#202020] transition focus-within:border-[#555555]">
            <textarea
              value={content}
              onChange={(e) => changeContent(e.target.value)}
              placeholder="Start writing here..."
              spellCheck={false}
              disabled={!loaded}
              className="min-h-[75vh] w-full flex-1 resize-none bg-transparent p-6 text-[15px] leading-7 text-[#E5E5E5] outline-none placeholder:text-[#666666] disabled:opacity-50 sm:p-8"
            />

            <div className="flex items-center justify-between border-t border-[#333333] px-5 py-3">
              <span className="text-xs text-[#777777]">
                {content.length} characters
              </span>
              <span className="text-xs text-[#777777]">{saveStatus}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#777777]">
              AFRID'S UNNECESSARY CONTRIBUTION TO HUMANITY.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={copyText}
                disabled={!content}
                className="min-w-[105px] rounded-lg border border-[#383838] px-4 py-2.5 text-sm text-[#BBBBBB] transition hover:border-[#777777] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied === 'text' ? 'Copied!' : 'Copy text'}
              </button>

              <button
                onClick={clearText}
                disabled={!content}
                className="rounded-lg px-4 py-2.5 text-sm text-[#BCA9A3] transition hover:bg-[#332A28] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-6 border-t border-[#333333] pt-4 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#888888]">
            A FILM BY AFRID
          </p>
          <p className="mt-1 text-[10px] tracking-wider text-[#666666]">
            EXCEPT IT'S A WEBSITE.
          </p>
        </footer>
      </div>
    </main>
  );
}
