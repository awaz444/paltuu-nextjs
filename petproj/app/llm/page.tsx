'use client'; // Ensure this is at the top of your file
import { useState } from 'react';
import Navbar from '@/components/navbar';
import '../globals.css'

export default function ChatBot() {
  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState<{ user: string; ai: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add the user's message to the chat log
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

      // Update the chat log with the AI response
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

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
        
        {/* Chat window */}
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="h-96 overflow-y-auto border-b border-gray-200 mb-4 p-4">
            {chatLog.length === 0 ? (
              <p className="text-gray-500">Start the conversation with Paltuu AI!</p>
            ) : (
              chatLog.map((chat, index) => (
                <div key={index} className="mb-4">
                  <p className="font-bold text-dark">You:</p>
                  <p className="mb-2">{chat.user}</p>
                  <p className="font-bold text-primary">Paltuu AI:</p>
                  <p>{chat.ai || '...'}</p>
                </div>
              ))
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-lg px-4 py-2 mr-4"
              placeholder="Ask me anything about pets..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={`px-6 py-2 bg-primary text-white rounded-lg ${loading ? 'bg-gray-400' : 'hover:bg-blue-600'}`}
              disabled={loading}
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
