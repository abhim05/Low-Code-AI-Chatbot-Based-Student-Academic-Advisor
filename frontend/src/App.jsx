import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000/api';

// ===== Simple Markdown Renderer =====
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/((<li>.*?<\/li>)(<br\/>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br\/>/g, '') + '</ul>';
  });

  return html;
}

// ===== Send Arrow SVG =====
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ===== Plus Icon =====
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function App() {
  // ===== State =====
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'analytics'
  const [analytics, setAnalytics] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ studentName: '', studentEmail: '', date: '', time: '', department: 'General Advising', reason: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);

  // ===== Load conversations on mount =====
  useEffect(() => {
    fetchConversations();
  }, []);

  // ===== Auto-scroll chat =====
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ===== Auto-resize textarea =====
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // ===== Helpers =====
  const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };
  const timeAgo = (date) => { const s = Math.floor((Date.now() - new Date(date)) / 1000); if (s < 60) return 'just now'; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const hr = Math.floor(m / 60); if (hr < 24) return `${hr}h ago`; return `${Math.floor(hr/24)}d ago`; };
  const copyMessage = (text, id) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const TIME_SLOTS = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
  const DEPARTMENTS = ['General Advising','Computer Science','Mathematics','English','Business','Psychology','Physics','Economics','History'];

  // ===== API Calls =====
  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post(`${API}/conversations`, { title: 'New Chat' });
      setConversations(prev => [res.data, ...prev]);
      setActiveConvId(res.data._id);
      setMessages([]);
      setView('chat');
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await axios.get(`${API}/conversations/${id}`);
      setActiveConvId(id);
      setMessages(res.data.messages || []);
      setView('chat');
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics`);
      setAnalytics(res.data);
      setView('analytics');
      setSidebarOpen(false);
    } catch (err) {
      alert('Failed to load analytics');
    }
  };

  // ===== Send Message =====
  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text) return;

    // If no active conversation, create one
    let convId = activeConvId;
    if (!convId) {
      try {
        const res = await axios.post(`${API}/conversations`, { title: text.slice(0, 50) });
        convId = res.data._id;
        setActiveConvId(convId);
        setConversations(prev => [res.data, ...prev]);
      } catch (err) {
        console.error('Failed to create conversation', err);
        return;
      }
    } else if (messages.length === 0) {
      // Update title from first message
      try {
        await axios.put(`${API}/conversations/${convId}`, { title: text.slice(0, 50) });
        setConversations(prev => prev.map(c => c._id === convId ? { ...c, title: text.slice(0, 50) } : c));
      } catch (err) { /* ignore */ }
    }

    const userMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'bot' ? 'model' : 'user', parts: [{ text: m.text }] }));

      const response = await axios.post(`${API}/chat`, {
        message: text,
        history,
        conversationId: convId
      });

      const botMessage = {
        role: 'bot',
        text: response.data.response,
        requiresHuman: response.data.requiresHuman,
        suggestBooking: response.data.suggestBooking
      };
      setMessages(prev => [...prev, botMessage]);

      // If requiresHuman or suggestBooking, show booking modal trigger
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ===== Appointment Booking =====
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await axios.post(`${API}/appointments`, bookingForm);
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        setBookingForm({ studentName: '', studentEmail: '', date: '', time: '', reason: '' });
      }, 3000);
    } catch (err) {
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ===== Check if no messages (show welcome) =====
  const showWelcome = view === 'chat' && messages.length === 0;

  const suggestions = [
    "What CS courses can I take as a freshman?",
    "What are the prerequisites for AI?",
    "How many credits do I need to graduate?",
    "Help me plan my semester schedule"
  ];

  // ===== RENDER =====
  return (
    <div className="app-container">
      {/* ===== Sidebar Backdrop (mobile) ===== */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===== Sidebar ===== */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat} id="new-chat-btn">
            <PlusIcon /> New chat
          </button>
        </div>

        <div className="sidebar-conversations">
          <div className="sidebar-section-label">Recent</div>
          {conversations.map(conv => (
            <div
              key={conv._id}
              className={`conversation-item ${conv._id === activeConvId ? 'active' : ''}`}
              onClick={() => loadConversation(conv._id)}
              id={`conv-${conv._id}`}
            >
              <span className="conv-icon">💬</span>
              <div className="conv-title-wrap">
                <span className="conv-title">{conv.title}</span>
                <span className="conv-subtitle">{timeAgo(conv.updatedAt)}</span>
              </div>
              <button className="conv-delete" onClick={(e) => deleteConversation(e, conv._id)} title="Delete">🗑</button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              No conversations yet
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={loadAnalytics} id="analytics-btn">
            📊 Analytics Dashboard
          </button>
          <button className="sidebar-footer-btn" onClick={() => { setShowBookingModal(true); setSidebarOpen(false); }} id="book-appointment-btn">
            📅 Book Appointment
          </button>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} id="menu-toggle">☰</button>
          <div className="top-bar-title">
            <span className="logo-dot"></span>
            AIVON 2.0
            {activeConvId && <span className="top-bar-conv-title">{conversations.find(c => c._id === activeConvId)?.title}</span>}
          </div>
          <div className="model-badge">Llama 3.3 70B</div>
        </div>

        {view === 'chat' ? (
          <>
            {showWelcome ? (
              /* Welcome Screen */
              <div className="welcome-screen">
                <div className="welcome-logo">AI</div>
                <p className="welcome-greeting">{getGreeting()} 👋</p>
                <h1 className="welcome-title">How can I help you today?</h1>
                <p className="welcome-subtitle">
                  I'm AIVON 2.0, your AI academic advisor. Ask me about courses, prerequisites, graduation requirements, policies, and campus resources.
                </p>
                <div className="suggestion-grid">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-card"
                      onClick={() => sendMessage(s)}
                      id={`suggestion-${i}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="chat-scroll-area" ref={chatScrollRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message-wrapper ${msg.role}`}>
                    <div className="message-content">
                      <div className={`avatar ${msg.role}`}>
                        {msg.role === 'bot' ? 'AI' : 'U'}
                      </div>
                      <div className="message-text">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                        {(msg.requiresHuman || msg.suggestBooking) && (
                          <button className="booking-btn" onClick={() => setShowBookingModal(true)}>📅 Book Advisor Appointment</button>
                        )}
                        {msg.role === 'bot' && (
                          <div className="message-actions">
                            <button className={`copy-btn ${copiedId === index ? 'copied' : ''}`} onClick={() => copyMessage(msg.text, index)}>
                              {copiedId === index ? '✓ Copied' : '⎘ Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message-wrapper bot">
                    <div className="message-content">
                      <div className="avatar bot">AI</div>
                      <div className="message-text">
                        <div className="typing-indicator">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="input-container">
              <div className="input-box">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AIVON..."
                  disabled={loading}
                  rows={1}
                  id="chat-input"
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  id="send-btn"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ===== Analytics Dashboard ===== */
          <div className="analytics-container">
            <div className="analytics-title">
              📊 Student Interaction Analysis
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{analytics?.totalInteractions || 0}</div>
                <div className="stat-label">Total Interactions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value danger">{analytics?.escalations || 0}</div>
                <div className="stat-label">Escalations</div>
              </div>
              <div className="stat-card">
                <div className="stat-value info">{analytics?.avgResponseTime ? Math.round(analytics.avgResponseTime) + 'ms' : 'N/A'}</div>
                <div className="stat-label">Avg Response</div>
              </div>
              <div className="stat-card">
                <div className="stat-value warning">{analytics?.totalAppointments || 0}</div>
                <div className="stat-label">Appointments</div>
              </div>
            </div>

            {/* Topic Breakdown */}
            {analytics?.topicBreakdown?.length > 0 && (
              <div className="analytics-section">
                <div className="analytics-section-title">📋 Topic Breakdown</div>
                <div className="breakdown-list">
                  {analytics.topicBreakdown.map((t, i) => {
                    const maxCount = Math.max(...analytics.topicBreakdown.map(x => x.count));
                    const pct = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
                    return (
                      <div key={i} className="breakdown-item">
                        <span className="breakdown-label">{t._id}</span>
                        <div className="breakdown-bar-bg">
                          <div className={`breakdown-bar ${t._id}`} style={{ width: `${pct}%` }}>
                            {pct > 20 ? t.count : ''}
                          </div>
                        </div>
                        <span className="breakdown-count">{t.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sentiment Donut Chart */}
            {analytics?.sentimentBreakdown?.length > 0 && (() => {
              const total = analytics.totalInteractions || 1;
              const r = 40; const circ = 2 * Math.PI * r;
              let offset = 0;
              const segments = analytics.sentimentBreakdown.map(s => {
                const pct = s.count / total;
                const dash = pct * circ;
                const seg = { ...s, dash, offset, pct };
                offset += dash;
                return seg;
              });
              return (
                <div className="analytics-section">
                  <div className="analytics-section-title">😊 Sentiment Distribution</div>
                  <div className="donut-chart-wrap">
                    <svg className="donut-svg" viewBox="0 0 100 100">
                      <circle className="donut-track" cx="50" cy="50" r={r} />
                      {segments.map((s, i) => (
                        <circle key={i} className={`donut-segment ${s._id}`} cx="50" cy="50" r={r}
                          strokeDasharray={`${s.dash} ${circ - s.dash}`}
                          strokeDashoffset={-s.offset} />
                      ))}
                    </svg>
                    <div className="donut-legend">
                      {segments.map((s, i) => (
                        <div key={i} className="donut-legend-item">
                          <div className={`donut-legend-dot ${s._id}`} />
                          <span className="donut-legend-label">{s._id}</span>
                          <span className="donut-legend-pct">{Math.round(s.pct * 100)}% ({s.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Daily Activity */}
            {analytics?.dailyActivity?.length > 0 && (
              <div className="analytics-section">
                <div className="analytics-section-title">📈 Daily Activity (Last 7 Days)</div>
                <div className="activity-chart">
                  {analytics.dailyActivity.map((d, i) => {
                    const maxCount = Math.max(...analytics.dailyActivity.map(x => x.count));
                    const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 10;
                    const day = new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={i} className="activity-bar-container">
                        <div className="activity-bar" style={{ height: `${heightPct}%` }} />
                        <span className="activity-label">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Response Time Stats */}
            {analytics?.avgResponseTime > 0 && (
              <div className="analytics-section">
                <div className="analytics-section-title">⚡ Response Time</div>
                <div className="response-time-row">
                  <div className="rt-stat"><div className="rt-stat-val">{Math.round(analytics.avgResponseTime)}ms</div><div className="rt-stat-label">Average</div></div>
                  <div className="rt-stat"><div className="rt-stat-val">{Math.round(analytics.minResponseTime || 0)}ms</div><div className="rt-stat-label">Fastest</div></div>
                  <div className="rt-stat"><div className="rt-stat-val">{Math.round(analytics.maxResponseTime || 0)}ms</div><div className="rt-stat-label">Slowest</div></div>
                </div>
              </div>
            )}

            {/* Recent Interactions (Expandable) */}
            <div className="analytics-section">
              <div className="analytics-section-title">📝 Recent Interactions</div>
              <div className="logs-list">
                {analytics?.recentLogs?.map((log, i) => (
                  <div key={i} className={`log-item ${expandedLog === i ? 'expanded' : ''}`}
                    onClick={() => setExpandedLog(expandedLog === i ? null : i)}>
                    <div className="log-message">
                      {log.message}
                      <span className="log-expand-icon">{expandedLog === i ? '▲' : '▼'}</span>
                    </div>
                    <div className="log-meta">
                      <span className={`log-sentiment ${log.sentiment}`}>{log.sentiment}</span>
                      <span className="log-topic">📁 {log.topic || 'general'}</span>
                      {log.responseTime > 0 && <span className="log-topic">⏱ {log.responseTime}ms</span>}
                      <span className="log-time">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="log-response">{log.aiResponse?.slice(0, 300)}{log.aiResponse?.length > 300 ? '...' : ''}</div>
                  </div>
                ))}
                {(!analytics?.recentLogs || analytics.recentLogs.length === 0) && (
                  <div className="empty-state"><div className="empty-state-icon">💬</div><div className="empty-state-text">No interactions yet. Start chatting!</div></div>
                )}
              </div>
            </div>

            {/* Recent Appointments */}
            {analytics?.recentAppointments?.length > 0 && (
              <div className="analytics-section">
                <div className="analytics-section-title">📅 Recent Appointments</div>
                <table className="appointments-table">
                  <thead><tr><th>Student</th><th>Date & Time</th><th>Department</th><th>Status</th></tr></thead>
                  <tbody>
                    {analytics.recentAppointments.map((a, i) => (
                      <tr key={i}>
                        <td>{a.studentName}</td>
                        <td>{a.date} {a.time}</td>
                        <td>{a.department || 'General'}</td>
                        <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Back button */}
            <div className="analytics-header" style={{justifyContent:'center', paddingBottom:'40px'}}>
              <button className="analytics-back-btn" onClick={() => setView('chat')}>← Back to Chat</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Appointment Booking Modal ===== */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📅 Book Advisor Appointment</h2>
              <button className="modal-close" onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}>×</button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success">
                <div className="success-icon">✅</div>
                <h3>Appointment Booked!</h3>
                <p>
                  Your appointment has been scheduled for <strong>{bookingForm.date}</strong> at <strong>{bookingForm.time}</strong>.
                  <br />A confirmation will be sent to <strong>{bookingForm.studentEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={bookingForm.studentName}
                    onChange={(e) => setBookingForm({ ...bookingForm, studentName: e.target.value })}
                    required
                    id="booking-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@university.edu"
                    value={bookingForm.studentEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, studentEmail: e.target.value })}
                    required
                    id="booking-email"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      required
                      id="booking-date"
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label">Time Slot</label>
                      {bookingForm.time && <span className="selected-time-display">{bookingForm.time}</span>}
                    </div>
                    <div className="time-slots-grid">
                      {TIME_SLOTS.map(slot => (
                        <button key={slot} type="button"
                          className={`time-slot-btn ${bookingForm.time === slot ? 'selected' : ''}`}
                          onClick={() => setBookingForm({ ...bookingForm, time: slot })}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })} id="booking-dept">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason (Optional)</label>
                  <input className="form-input" type="text" placeholder="e.g., Course selection, degree planning..."
                    value={bookingForm.reason} onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                    id="booking-reason" />
                </div>
                <button type="submit" className="modal-submit" disabled={bookingLoading} id="booking-submit">
                  {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;