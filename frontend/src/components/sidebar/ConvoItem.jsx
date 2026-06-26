import React from 'react';
import Avatar from '../ui/Avatar';
import { formatConvoTime } from '../../utils/time';
import { idsEqual } from '../../utils/id';

export default function ConvoItem({ convo, currentUserId, isActive, unreadCount, onClick }) {
  const otherUser = convo.isGroup
    ? null
    : convo.participants.find(p => !idsEqual(p._id, currentUserId));

  const displayName = convo.isGroup ? convo.name : (otherUser?.username || 'Chat');
  const avatarSrc   = convo.isGroup
    ? null
    : otherUser?.imageUrl;
  const isOnline    = convo.isGroup ? undefined : otherUser?.isOnline;
  const preview     = convo.lastMessage?.text || 'No messages yet';
  const time        = convo.lastMessage?.createdAt
    ? formatConvoTime(convo.lastMessage.createdAt)
    : '';
  const hasUnread   = unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-2xl cursor-pointer
        transition-all duration-150 group select-none
        ${isActive
          ? 'bg-electric/10 active-indicator'
          : 'hover:bg-overlay'
        }
      `}
    >
      {/* Avatar */}
      <Avatar
        src={avatarSrc}
        name={displayName}
        size="md"
        isOnline={isOnline}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-sm font-semibold truncate ${
            hasUnread ? 'text-text-bright' : isActive ? 'text-text-bright' : 'text-text-primary group-hover:text-text-bright'
          }`}>
            {displayName}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {time && (
              <span className={`text-2xs ${hasUnread ? 'text-electric-400 font-semibold' : isActive ? 'text-electric-400' : 'text-text-muted'}`}>
                {time}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate flex-1 ${
            hasUnread ? 'text-text-primary font-medium' : isActive ? 'text-electric-300' : 'text-text-second'
          }`}>
            {preview}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-accent-grad
                             flex items-center justify-center text-[10px] font-bold text-white shadow-glow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
