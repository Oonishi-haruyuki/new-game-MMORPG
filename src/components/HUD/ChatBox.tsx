import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatChannel } from '../../types/game';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, channel: ChatChannel) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('world');
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isCollapsed]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), activeChannel);
    setInputText('');
  };

  const filteredMessages = messages.filter((m) => {
    if (activeChannel === 'world') return true; // show all in world
    return m.channel === activeChannel;
  });

  const getChannelBadge = (ch: ChatChannel) => {
    switch (ch) {
      case 'world':
        return <span className="text-[10px] text-amber-400 font-bold">[ワールド]</span>;
      case 'guild':
        return <span className="text-[10px] text-emerald-400 font-bold">[ギルド]</span>;
      case 'party':
        return <span className="text-[10px] text-cyan-400 font-bold">[PT]</span>;
      case 'combat':
        return <span className="text-[10px] text-rose-400 font-bold">[戦闘]</span>;
      case 'system':
        return <span className="text-[10px] text-yellow-300 font-bold">[システム]</span>;
    }
  };

  return (
    <div className="flex flex-col w-72 sm:w-80 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl pointer-events-auto select-none transition-all duration-200">
      {/* Top Header & Tabs */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/80 bg-slate-900/50 rounded-t-xl">
        <div className="flex items-center gap-1 text-[11px]">
          {(['world', 'guild', 'party', 'combat'] as ChatChannel[]).map((ch) => {
            const labels: Record<string, string> = {
              world: '全体',
              guild: 'ギルド',
              party: 'PT',
              combat: '戦闘ログ'
            };
            const isActive = activeChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`px-2 py-0.5 rounded transition-colors font-medium ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[ch]}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'チャットを展開' : 'チャットを最小化'}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Message Area */}
      {!isCollapsed && (
        <>
          <div
            ref={scrollRef}
            className="h-36 sm:h-40 overflow-y-auto p-2.5 space-y-1.5 text-xs text-slate-200 font-sans selection:bg-cyan-600"
          >
            {filteredMessages.slice(-40).map((msg) => (
              <div key={msg.id} className="leading-snug break-words">
                {getChannelBadge(msg.channel)}{' '}
                {msg.sender !== 'システム' && (
                  <span className="font-bold text-slate-300">{msg.sender}: </span>
                )}
                <span className={msg.channel === 'combat' ? 'text-slate-300 font-mono text-[11px]' : 'text-slate-200'}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-1.5 p-1.5 border-t border-slate-800/80 bg-slate-900/40 rounded-b-xl"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="メッセージを入力 (Enterで送信)..."
              maxLength={80}
              className="flex-1 bg-slate-900/90 text-xs text-white px-2.5 py-1 rounded-lg border border-slate-700/80 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-amber-600 text-slate-950 font-bold hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
