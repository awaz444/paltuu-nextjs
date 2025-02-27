'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/navbar';
import '../globals.css';
import ReactMarkdown from 'react-markdown';
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

export default function ChatBot() {
  
  useSetPrimaryColor();

  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState<{ user: string; ai: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newChatLog = [...chatLog, { user: userInput, ai: '' }];
    setChatLog(newChatLog);
    setLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
      });

      const data = await response.json();

      setChatLog((prevLog) => {
        const updatedLog = [...prevLog];
        updatedLog[updatedLog.length - 1].ai = data.data || 'Sorry, something went wrong!';
        return updatedLog;
      });
    } catch (error) {
      console.error('Error during the API request:', error);
      setChatLog((prevLog) => {
        const updatedLog = [...prevLog];
        updatedLog[updatedLog.length - 1].ai = 'Error: Unable to fetch a response. Please try again.';
        return updatedLog;
      });
    } finally {
      setUserInput('');
      setLoading(false);
    }
  };

  const [primaryColor, setPrimaryColor] = useState("#000000"); // Default fallback color

  useEffect(() => {
    // Get the computed style of the `--primary-color` CSS variable
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        {/* Chat Container (Fixed Height) */}
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6 h-[80vh] flex flex-col">

          {/* Chat History (Scrollable when overflowing) */}
          <div className="flex-grow overflow-y-auto border-b border-gray-200 p-4">
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

          {/* Input Form (Pinned at the bottom) */}
          <form onSubmit={handleSubmit} className="flex items-center mt-4">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-xl px-4 py-2 mr-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ask me anything about pets..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded-xl text-white transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-dark'}`}
              disabled={loading}
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
