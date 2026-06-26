import React, { useState } from 'react';
import { MessageSquare, Users, Zap, Wifi, WifiOff } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import SearchBar from './SearchBar';
import ConvoItem from './ConvoItem';
import NewGroupModal from './NewGroupModal';
import Spinner from '../ui/Spinner';

export default function Sidebar({
  dbUser,
  isConnected,
  conversations,
  usersList,
  activeConvoId,
  isLoading,
  unreadCounts,
  onSelectConvo,
  onStartChat,
  onCreateGroup,
  mobileHidden = false,
}) {
  const [query,          setQuery]          = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Filter conversations by query
  const filteredConvos = conversations.filter(c => {
    if (!query) return true;
    if (c.isGroup) return c.name.toLowerCase().includes(query.toLowerCase());
    const other = c.participants.find(p => p._id !== dbUser?._id);
    return other?.username.toLowerCase().includes(query.toLowerCase());
  });

  // Search new users to DM
  const matchedUsers = query
    ? usersList.filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleGroupCreate = async (name, participantIds) => {
    const convo = await onCreateGroup(name, participantIds);
    if (convo) onSelectConvo(convo);
    return convo;
  };

  return (
    <aside className={`
      relative flex flex-col h-full bg-abyss border-r border-border-faint accent-bar-top
      w-full md:w-[300px] md:min-w-[260px]
      ${mobileHidden ? 'hidden md:flex' : 'flex'}
    `}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-faint flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-grad flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-bright tracking-tight">Nexus</p>
            <div className={`flex items-center gap-1.5 text-2xs font-medium ${isConnected ? 'text-emerald' : 'text-text-muted'}`}>
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-green" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff size={10} />
                  Offline
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            title="Create Group Chat"
            onClick={() => setShowGroupModal(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       text-text-muted hover:text-text-primary hover:bg-overlay
                       border border-transparent hover:border-border-soft
                       transition-all duration-150"
          >
            <Users size={16} />
          </button>
          <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-border-mid flex-shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-border-faint flex-shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
        />
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* New users from search */}
            {matchedUsers.length > 0 && (
              <div className="mb-2">
                <p className="px-5 py-1.5 text-2xs font-bold uppercase tracking-widest text-electric-400">
                  Start a chat
                </p>
                {matchedUsers.map(u => (
                  <div
                    key={u._id}
                    onClick={() => { onStartChat(u); setQuery(''); }}
                    className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-2xl cursor-pointer
                               hover:bg-overlay transition-all duration-150 group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={u.imageUrl || ''}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-border-soft"
                        onError={(e) => { e.target.style.display='none'; }}
                      />
                      <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-abyss ${u.isOnline ? 'bg-emerald' : 'bg-text-faint'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-text-bright truncate">{u.username}</p>
                      <p className="text-xs text-text-muted truncate">{u.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                    <MessageSquare size={14} className="text-text-faint group-hover:text-electric transition-colors" />
                  </div>
                ))}
                <div className="mx-3 my-2 border-t border-border-faint" />
              </div>
            )}

            {/* Conversations */}
            {filteredConvos.length > 0 && (
              <>
                <p className="px-5 py-1.5 text-2xs font-bold uppercase tracking-widest text-text-muted">
                  Messages
                </p>
                {filteredConvos.map(c => (
                  <ConvoItem
                    key={c._id}
                    convo={c}
                    currentUserId={dbUser?._id}
                    isActive={c._id === activeConvoId}
                    unreadCount={unreadCounts?.[c._id] || 0}
                    onClick={() => onSelectConvo(c)}
                  />
                ))}
              </>
            )}

            {/* Empty state */}
            {filteredConvos.length === 0 && matchedUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-electric/10 flex items-center justify-center border border-border-accent">
                  <MessageSquare size={24} className="text-electric-400" />
                </div>
                <p className="text-sm text-text-muted">
                  {query ? 'No results found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-text-faint">
                  {query ? 'Try a different search term' : 'Search for a user above to start chatting'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Group modal ─────────────────────────────────────────── */}
      <NewGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        usersList={usersList}
        currentUserId={dbUser?._id}
        onCreate={handleGroupCreate}
      />
    </aside>
  );
}
