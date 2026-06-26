import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

export default function ChatInput({ onSend, onTyping, onStopTyping, username }) {
  const [text, setText]   = useState('');
  const inputRef          = useRef(null);
  const typingRef         = useRef(false);
  const timerRef          = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val && !typingRef.current) {
      typingRef.current = true;
      onTyping?.(username);
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      onStopTyping?.(username);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
    typingRef.current = false;
    clearTimeout(timerRef.current);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="flex-shrink-0 px-2 md:px-4 py-2 md:py-3 pb-safe header-blur border-t border-border-faint">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Attachment */}
        <button
          type="button"
          title="Attach file"
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     text-text-muted hover:text-text-primary hover:bg-overlay
                     transition-all duration-150 flex-shrink-0"
        >
          <Paperclip size={17} />
        </button>

        {/* Input pill */}
        <div className={`
          flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-200
          ${hasText
            ? 'bg-elevated border-border-accent shadow-glow-sm'
            : 'bg-overlay border-border-soft hover:border-border-mid'
          }
        `}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-transparent outline-none text-sm text-text-primary caret-electric placeholder-text-muted"
          />
          <button
            type="button"
            title="Emoji"
            className="flex-shrink-0 text-text-muted hover:text-electric transition-colors duration-150"
          >
            <Smile size={17} />
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!hasText}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${hasText
              ? 'bg-accent-grad text-white shadow-glow-sm hover:shadow-glow hover:scale-105 cursor-pointer'
              : 'bg-overlay text-text-faint cursor-default'
            }
          `}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
