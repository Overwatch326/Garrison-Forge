"use client";

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'lg';
}

// Super lightweight rich text editor using contentEditable.
// Not as fancy as Quill/Tiptap, but no external deps and works fine for
// notes/signatures in this app.

export function RichTextEditor({ value, onChange, placeholder, className, size = 'sm' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

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
    'px-1.5 py-0.5 rounded-sm text-[11px] text-slate-400 hover:text-slate-50 hover:bg-slate-800/70 transition-colors';

  return (
    <div className={className}>
      <div className="mb-1 flex flex-wrap gap-1 text-[11px] items-center justify-between text-slate-400">
        <div className="flex flex-wrap gap-1 items-center">
          <button type="button" className={buttonBase} onClick={() => exec('bold')}>
            <span className="font-semibold">B</span>
          </button>
          <button type="button" className={buttonBase} onClick={() => exec('italic')}>
            <span className="italic">I</span>
          </button>
          <button type="button" className={buttonBase} onClick={() => exec('underline')}>
            <span className="underline">U</span>
          </button>
          <button type="button" className={buttonBase} onClick={() => exec('strikeThrough')}>
            <span className="line-through">S</span>
          </button>

          <span className="mx-1 h-3 w-px bg-slate-700/70" />

          <button type="button" className={buttonBase} onClick={() => exec('formatBlock', 'h3')}>
            H3
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

          <span className="mx-1 h-3 w-px bg-slate-700/70" />

          <button
            type="button"
            className={buttonBase}
            onClick={() => exec('formatBlock', 'blockquote')}
          >
            Quote
          </button>
          <button type="button" className={buttonBase} onClick={handleLink}>
            Link
          </button>
        </div>

        <button
          type="button"
          className={`${buttonBase} text-[10px] px-2 py-0.5 text-slate-500 hover:text-slate-100`}
          onClick={() => {
            exec('removeFormat');
          }}
        >
          Clear
        </button>
      </div>

      <div
        className={
          'relative rounded-md border px-2 py-1 bg-slate-950/70' +
          (isFocused ? ' border-slate-400 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]' : ' border-slate-800')
        }
      >
        {placeholder && !value && !isFocused && (
          <div className="pointer-events-none absolute inset-x-2 top-1.5 text-[11px] text-slate-500 select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`${size === 'lg' ? 'min-h-[260px]' : 'min-h-[120px]'} text-xs sm:text-sm leading-relaxed focus:outline-none prose prose-invert max-w-none [&_*]:text-inherit [&_*]:font-normal`}
        />
      </div>
    </div>
  );
}
