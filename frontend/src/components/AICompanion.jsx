import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Sparkles, User, Brain } from 'lucide-react';

const AICompanion = () => {
  const { user, authFetch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'companion', text: 'Greetings. I am Aria, your growth companion. How is your focus block progressing today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setTyping(true);

    const apiKey = user?.geminiApiKey || 'AIzaSyBFMI3frSYOwOAGZd75FqV25j_oWPuf9p0';
    try {
      let contextStr = '';
      const contextRes = await authFetch('/ai/suggestions', { method: 'POST' });
      if (contextRes.ok) {
        const cData = await contextRes.json();
        contextStr = `Current stats - Life Score: ${cData.lifeScore}/100, Burnout: ${cData.burnoutProb}%, Workload recommendation: "${cData.lifeOperatorSuggestion}".`;
      }

      const prompt = `You are Aria, a premium supportive AI Companion inside the Growth tracking application. 
Your goal is to help the student build discipline, consistency, and exam readiness.
Current User Context: ${contextStr || 'No logs loaded yet.'}

Instructions:
1. Provide clinical, supportive, and elite motivational responses.
2. Keep it brief (under 80 words).
3. Do NOT use emojis.
4. Do NOT say you are an AI assistant; you are Aria, their growth companion.

User message: "${userMsg}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (response.ok) {
        const result = await response.json();
        const replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'I am processing your daily routine insights. Let us stay focused.';
        setMessages(prev => [...prev, { sender: 'companion', text: replyText.trim() }]);
      } else {
        setMessages(prev => [...prev, { sender: 'companion', text: 'I am here. Let us stay aligned with our study strategizer roadmap.' }]);
      }
    } catch (e) {
      console.error('Companion error:', e);
      setMessages(prev => [...prev, { sender: 'companion', text: 'Connection buffer. Keep executing your tasks while I reconnect.' }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating Sparkles Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="companion-floating-btn"
        title="Toggle AI Companion"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          className="companion-panel card"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '360px',
            height: '460px',
            zIndex: 1200,
            background: 'rgba(18, 20, 29, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {/* Header */}
          <div 
            className="flex justify-between align-center" 
            style={{ 
              padding: '14px 18px', 
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            <div className="flex align-center gap-8">
              <div 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'var(--color-success)',
                  boxShadow: '0 0 8px var(--color-success)'
                }} 
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Aria — AI Companion</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      color: 'var(--text-muted)', 
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isUser ? <User size={10} /> : <Brain size={10} />}
                    {isUser ? 'You' : 'Aria'}
                  </span>
                  <div 
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      background: isUser ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--text-primary)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      borderTopRightRadius: isUser ? '2px' : '12px',
                      borderTopLeftRadius: isUser ? '12px' : '2px',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {typing && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Brain size={10} className="spin" />
                Aria is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form 
            onSubmit={handleSend}
            style={{ 
              padding: '12px', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Talk to Aria about your focus..."
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button 
              type="submit"
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AICompanion;
