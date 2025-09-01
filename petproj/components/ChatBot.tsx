'use client';
import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePathname } from 'next/navigation';
import { useSetPrimaryColor } from '@/app/hooks/useSetPrimaryColor';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState<{ user: string; ai: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const pathname = usePathname();
  useSetPrimaryColor();

  // only show bump if route matches AND screen is small
  const hasListingButton =
    (pathname === '/browse-pets' || pathname === '/foster-pets' || pathname === '/lost-and-found') && isSmallScreen;

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--primary-color').trim();
    if (color) setPrimaryColor(color);
  }, []);

  // detect small screens (Tailwind sm breakpoint = 640px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    setIsSmallScreen(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newChatLog = [...chatLog, { user: userInput, ai: '' }];
    setChatLog(newChatLog);
    setLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });

      const data = await response.json();

      setChatLog((prevLog) => {
        const updatedLog = [...prevLog];
        updatedLog[updatedLog.length - 1].ai =
          data.data || 'Sorry, something went wrong!';
        return updatedLog;
      });

      if (!isOpen) setHasNewMessage(true);
    } catch (error) {
      console.error('Error during the API request:', error);
      setChatLog((prevLog) => {
        const updatedLog = [...prevLog];
        updatedLog[updatedLog.length - 1].ai =
          'Error: Unable to fetch a response. Please try again.';
        return updatedLog;
      });
      if (!isOpen) setHasNewMessage(true);
    } finally {
      setUserInput('');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) setHasNewMessage(false);
  }, [isOpen]);

  return (
    <div
      className={`fixed right-0 z-40 transition-all duration-300 ${
        hasListingButton
          ? isOpen
            ? 'bottom-2 right-2'
            : 'bottom-2 right-2'
          : isOpen
          ? 'bottom-2 right-2'
          : 'bottom-2 right-2'
      }`}
    >
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-primary text-white p-4 rounded-full shadow-lg hover:bg-dark transition"
        >
          <MessageSquare size={24} />
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-80 h-[500px] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div
            className="flex justify-between items-center px-4 py-2 bg-primary text-white"
          >
            <span className="font-semibold">Paltuu AI</span>
            <button onClick={() => setIsOpen(false)} className="text-white">
              ✕
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            {chatLog.length === 0 ? (
              <p className="text-gray-500">Start the conversation with Paltuu AI!</p>
            ) : (
              chatLog.map((chat, index) => (
                <div key={index} className="mb-4">
                  <p className="font-bold text-dark">You:</p>
                  <p className="mb-2">{chat.user}</p>
                  <p className="font-bold text-primary">Paltuu AI:</p>
                  <ReactMarkdown>{chat.ai || '...'}</ReactMarkdown>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center p-2 border-t">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-xl px-3 py-2 mr-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ask me anything about pets..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-white transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-dark'
              }`}
              disabled={loading}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
