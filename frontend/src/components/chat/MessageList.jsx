import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Spinner from '../ui/Spinner';
import { groupMessagesByDate } from '../../utils/time';
import { idsEqual } from '../../utils/id';

export default function MessageList({ messages, typingUser, isLoading, currentUserId, isGroup }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-muted">Loading messages...</p>
        </div>
      </div>
    );
  }

  const groups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pl-4 pr-3 sm:pl-6 sm:pr-4 py-4 flex flex-col">
      {groups.map(({ dateLabel, messages: dayMsgs }) => (
        <div key={dateLabel}>
          {/* Date divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border-faint" />
            <span className="text-2xs font-bold uppercase tracking-widest text-text-muted px-2">
              {dateLabel}
            </span>
            <div className="flex-1 h-px bg-border-faint" />
          </div>

          {/* Messages */}
          {dayMsgs.map((msg, idx) => {
            const isOutgoing  = idsEqual(msg.sender?._id, currentUserId);
            const prevMsg     = dayMsgs[idx - 1];
            const isGrouped   = prevMsg && idsEqual(prevMsg.sender?._id, msg.sender?._id);
            const showSender  = isGroup && !isOutgoing;

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOutgoing={isOutgoing}
                showSenderName={showSender && !isGrouped}
                isGrouped={isGrouped}
              />
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      <TypingIndicator username={typingUser} />

      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
