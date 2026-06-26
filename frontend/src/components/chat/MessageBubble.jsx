import React from 'react';
import { formatTime } from '../../utils/time';
import { Check, CheckCheck } from 'lucide-react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

export default function MessageBubble({ msg, isOutgoing, showSenderName, isGrouped }) {
  const time     = formatTime(msg.createdAt);
  const isRead   = msg.readBy?.length > 1;

  return (
    <div className={`flex flex-col w-fit max-w-[85%] md:max-w-[75%] animate-fade-up
      ${isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'}
      ${isGrouped ? 'mt-0.5' : 'mt-3'}
    `}>
      {/* Sender name for group chats */}
      {showSenderName && !isOutgoing && (
        <span className="text-2xs font-semibold text-electric-400 mb-1 ml-1">
          {msg.sender?.username}
        </span>
      )}

      {/* Bubble + reaction hover zone */}
      <div className="group relative">
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOutgoing
              ? 'bg-accent-grad text-white rounded-br-sm bubble-tail-right shadow-glow-sm'
              : 'bg-elevated text-text-primary border border-border-soft rounded-bl-sm bubble-tail-left'
            }
          `}
        >
          {msg.text}
        </div>

        {/* Reaction bar on hover */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5
            bg-elevated border border-border-soft rounded-full px-2 py-1
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            pointer-events-none group-hover:pointer-events-auto z-10
            ${isOutgoing ? 'right-full mr-2' : 'left-full ml-2'}
          `}
        >
          {REACTIONS.map(r => (
            <button
              key={r}
              className="text-sm hover:scale-125 transition-transform duration-100 cursor-pointer leading-none"
              title={r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Timestamp + read tick */}
      <div className={`flex items-center gap-1 mt-1 px-1 text-2xs text-text-muted`}>
        <span>{time}</span>
        {isOutgoing && (
          isRead
            ? <CheckCheck size={13} className="text-cobalt-400" />
            : <Check size={13} />
        )}
      </div>
    </div>
  );
}
