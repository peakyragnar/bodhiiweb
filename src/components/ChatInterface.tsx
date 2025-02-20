'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import Logo from './Logo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInConversation, setIsInConversation] = useState(false);
  const [isSimplifiedView, setIsSimplifiedView] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    if (!isInConversation) {
      setIsInConversation(true);
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const formData = new FormData();
    formData.append('message', input);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    if (messages.length > 0) {
      formData.append('messages', JSON.stringify(messages));
    }

    const userMessage: Message = { 
      role: 'user', 
      content: selectedFile ? `[Image Upload] ${input}` : input 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
        signal, // Add abort signal to fetch request
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      // Only add error message if not aborted
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${errorMessage}` 
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const categories = [
    { icon: '🔧', name: 'Plumbing' },
    { icon: '⚡', name: 'Electrical' },
    { icon: '🔥', name: 'Heating' },
    { icon: '🔌', name: 'Appliances' },
    { icon: '❄️', name: 'HVAC' },
    { icon: '🏠', name: 'General' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#0A0B0E] via-[#1a1b1e] to-[#2d2e35]">
      {/* Navigation Bar */}
      <nav className="bg-[#0A0B0E]/90 backdrop-blur-xl border-b border-white/5 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link 
              href="/" 
              onClick={() => {
                setIsInConversation(false);
                setMessages([]);
                setInput('');
                setIsSimplifiedView(false);
              }} 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Logo />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 text-2xl font-extrabold tracking-tighter">
                Bodhii
              </span>
            </Link>
            <button
              onClick={() => {
                setIsInConversation(false);
                setMessages([]);
                setInput('');
                setIsSimplifiedView(true);
              }}
              className="group relative p-2 hover:bg-white/5 rounded-lg transition-all duration-300"
              title="New fix"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                New fix
              </span>
            </button>
          </div>
          <div className="flex items-center space-x-6">
            {/* Social Icons */}
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-7a8.16 8.16 0 004.65 1.49v-3.88a4.85 4.85 0 01-1.2 0z"/>
              </svg>
            </a>
            <div className="h-4 w-px bg-white/10"></div>
            <button className="text-gray-200 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/5">
              Sign in
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {!isInConversation ? (
          <div className="flex flex-col items-center justify-start pt-24 px-4">
            {isSimplifiedView ? (
              <div className="w-full max-w-2xl px-4">
                <form onSubmit={handleSubmit} className="relative group">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() || selectedFile) {
                              handleSubmit(e);
                            }
                          }
                        }}
                        placeholder="Describe your home repair issue..."
                        className="w-full p-6 pr-32 rounded-full bg-[#1a1b1e]/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5 focus:border-white/10 transition-all duration-300 text-lg backdrop-blur-sm shadow-lg"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                          title="Upload photo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </button>
                        <button
                          type="submit"
                          disabled={(!input.trim() && !selectedFile) || isLoading}
                          className={`p-3 text-gray-400 hover:text-white transition-all duration-300 ${(!input.trim() && !selectedFile) || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        >
                          {isLoading ? (
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="absolute -bottom-8 left-6 text-sm text-gray-400">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <>
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 text-center mb-6 tracking-tight">
                  Your AI Home Repair Assistant
                </h1>
                <p className="text-gray-300 text-xl text-center mb-16 max-w-2xl font-light leading-relaxed">
                  Describe any home repair issue, and I'll guide you through the fix with step-by-step instructions
                </p>

                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl w-full mb-16">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1a1b1e]/50 hover:bg-[#1a1b1e] transition-all duration-300 border border-white/5 hover:border-white/10 backdrop-blur-sm hover:scale-105 group"
                    >
                      <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                      <span className="text-sm text-gray-300 font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-2xl px-4 mb-24">
                  <form onSubmit={handleSubmit} className="relative group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (input.trim() || selectedFile) {
                            handleSubmit(e);
                          }
                        }
                      }}
                      placeholder="Describe your home repair issue..."
                      className="w-full p-6 pr-32 rounded-full bg-[#1a1b1e]/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5 focus:border-white/10 transition-all duration-300 text-lg backdrop-blur-sm shadow-lg"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                        title="Upload photo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>
                      <button
                        type="submit"
                        disabled={(!input.trim() && !selectedFile) || isLoading}
                        className={`p-3 text-gray-400 hover:text-white transition-all duration-300 ${(!input.trim() && !selectedFile) || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                      >
                        {isLoading ? (
                          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {selectedFile && (
                      <div className="absolute -bottom-8 left-6 text-sm text-gray-400">
                        Selected: {selectedFile.name}
                      </div>
                    )}
                  </form>
                </div>

                {/* Testimonials Section */}
                <div className="w-full max-w-5xl mb-24">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 text-center mb-12">
                    Trusted by Homeowners Everywhere
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    <div className="bg-[#1a1b1e]/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-300 hover:transform hover:scale-[1.02] group">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                          ⚡
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">Sarah M.</h3>
                          <p className="text-gray-400 text-sm font-medium">Electrical Issue</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed font-light">"The AI helped me diagnose a tricky electrical problem in my kitchen. Saved me hundreds on an electrician visit!"</p>
                    </div>

                    <div className="bg-[#1a1b1e]/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-300 hover:transform hover:scale-[1.02] group">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                          🔧
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">Mike R.</h3>
                          <p className="text-gray-400 text-sm font-medium">Plumbing Fix</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed font-light">"Step-by-step guidance helped me fix a leaky faucet. The instructions were clear and easy to follow."</p>
                    </div>

                    <div className="bg-[#1a1b1e]/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-300 hover:transform hover:scale-[1.02] group">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                          ❄️
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">Lisa T.</h3>
                          <p className="text-gray-400 text-sm font-medium">HVAC Maintenance</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed font-light">"Got my AC working again in the middle of summer! The troubleshooting steps were spot-on."</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4 pb-32">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 ${
                      message.role === 'assistant'
                        ? 'bg-[#1a1b1e]/50 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-teal-400 text-white'
                    }`}
                  >
                    <ReactMarkdown className="prose prose-invert">{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E] to-transparent">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative mb-8">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() || selectedFile) {
                              handleSubmit(e);
                            }
                          }
                        }}
                        placeholder="Ask follow-up questions..."
                        className="w-full p-4 pr-24 rounded-full bg-[#1a1b1e]/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5 focus:border-white/10 transition-all duration-300 backdrop-blur-sm shadow-lg"
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                          title="Upload photo"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </button>
                        {isLoading ? (
                          <button
                            type="button"
                            onClick={handleStop}
                            className="p-2 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
                            title="Stop generating"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={(!input.trim() && !selectedFile) || isLoading}
                            className={`p-2 text-gray-400 hover:text-white transition-all duration-300 ${(!input.trim() && !selectedFile) || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="absolute -bottom-6 left-4 text-sm text-gray-400">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 