"use client";

import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Super lightweight rich text editor using contentEditable.
// Not as fancy as Quill/Tiptap, but no external deps and works fine for
// notes/signatures in this app.

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only update innerHTML if it differs, to avoid blowing away selection while typing.
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  function handleInput() {
    const el = ref.current;
    if (!el) return;
    onChange(el.innerHTML);
  }

  function exec(command: string, valueArg?: string) {
    document.execCommand(command, false, valueArg);
    handleInput();
  }

  function handleLink() {
    const url = window.prompt('URL', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

  const buttonBase =
    'px-2 py-1 rounded-md border border-slate-700 bg-slate-900/70 text-[11px] text-slate-200 hover:border-imperial-red/70 hover:text-imperial-red';

  return (
    <div className={className}>
      <div className="mb-1 flex flex-wrap gap-1 text-[11px]">
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('bold')}
        >
          B
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('italic')}
        >
          I
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('underline')}
        >
          U
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('strikeThrough')}
        >
          S
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('insertUnorderedList')}
        >
          • List
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => exec('insertOrderedList')}
        >
          1. List
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={handleLink}
        >
          Link
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => {
            exec('removeFormat');
          }}
        >
          Clear
        </button>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-950/60 px-1 py-0.5">
        {placeholder && !value && (
          <div className="text-[11px] text-slate-500 mb-1">{placeholder}</div>
        )}
        <div
          ref={ref}
          contentEditable
          onInput={handleInput}
          className="min-h-[120px] text-xs sm:text-sm focus:outline-none prose prose-invert max-w-none"
        />
      </div>
    </div>
  );
}
