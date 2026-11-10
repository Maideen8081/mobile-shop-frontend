import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, BookOpen, Box, ChevronRight, CircleCheck, CreditCard, History, MessageCircle,
  MessagesSquare, Mic, MoreVertical, Phone, Plus, Recycle, Send, ShieldCheck, Smartphone, Sparkles,
  Tag, TrendingUp, Truck, UserRound, Wrench, X,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import ChatAssistantIcon from '../components/ecommerce/ChatAssistantIcon'
import { SUPPORT_PHONE, SUPPORT_PHONE_DIAL, useSupportChat, type ChatMessage } from '../components/ecommerce/useSupportChat'
import './SupportChatPage.css'

const WHATSAPP_URL = 'https://wa.me/919876543210?text=Hi%20PhoneFix%2C%20I%20need%20some%20help'
const HISTORY_KEY = 'support_chat_history'
const MAX_HISTORY = 10

const ACTIONS = [
  { icon: Wrench, title: 'Book a Repair', desc: 'Get your device serviced', ask: 'I want to book a repair' },
  { icon: Box, title: 'Track My Order', desc: 'Check live order status', ask: 'How do I track my order?' },
  { icon: ShieldCheck, title: 'Warranty & Service', desc: 'Coverage and claims', ask: 'What does the warranty cover?' },
  { icon: Smartphone, title: 'Product Help', desc: 'Compare, choose & more', ask: 'Help me choose a new phone' },
]

const POPULAR = ['How to book a repair?', 'Check my order status', 'Claim warranty', 'Return or exchange policy']

const TOPICS = [
  { icon: Wrench, label: 'Repairs & Service', ask: 'Tell me about your repair services' },
  { icon: Truck, label: 'Orders & Delivery', ask: 'How long does delivery take?' },
  { icon: ShieldCheck, label: 'Warranty & Returns', ask: 'What is your warranty and return policy?' },
  { icon: CreditCard, label: 'Payment & Refunds', ask: 'Which payment methods do you accept and how do refunds work?' },
  { icon: Tag, label: 'Products & Buying Guide', ask: 'Help me choose the right phone for my budget' },
  { icon: Recycle, label: 'Trade-in & Refurbished', ask: 'How does trade-in and refurbished buying work?' },
  { icon: UserRound, label: 'Account & Login', ask: 'I need help with my account and login' },
]
const VISIBLE_TOPICS = 5

type SavedChat = { id: number; title: string; savedAt: string; messages: ChatMessage[] }

function readHistory(): SavedChat[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeHistory(list: SavedChat[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))) } catch { /* history is optional */ }
}

// Browser speech-to-text (Chrome / Edge / Safari). The mic is hidden where it isn't supported.
type Recognition = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
const SpeechRecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Recognition) | undefined
    : undefined

export default function SupportChatPage() {
  const { messages, input, setInput, typing, scrollRef, send, reset, load } = useSupportChat()
  const [stored, setStored] = useState<SavedChat[]>(readHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [allTopics, setAllTopics] = useState(false)
  const [listening, setListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognition = useRef<Recognition | null>(null)
  const [activeChatId, setActiveChatId] = useState(() => Date.now())

  const started = messages.some((m) => m.from === 'user')

  // The list shows the current conversation first, then older saved ones.
  const firstQuestion = messages.find((m) => m.from === 'user')?.text || 'Conversation'
  const current: SavedChat | null = started
    ? {
        id: activeChatId,
        title: firstQuestion.length > 60 ? `${firstQuestion.slice(0, 57)}…` : firstQuestion,
        savedAt: '',
        messages,
      }
    : null
  const history = current ? [current, ...stored.filter((c) => c.id !== current.id)] : stored

  // Save the current conversation as it grows.
  useEffect(() => {
    if (!started) return
    const saved = readHistory()
    const first = messages.find((m) => m.from === 'user')?.text || 'Conversation'
    const entry: SavedChat = {
      id: activeChatId,
      title: first.length > 60 ? `${first.slice(0, 57)}…` : first,
      savedAt: new Date().toISOString(),
      messages,
    }
    writeHistory([entry, ...saved.filter((c) => c.id !== entry.id)])
  }, [messages, started, activeChatId])

  // Close the popovers on outside click / Escape.
  useEffect(() => {
    if (!historyOpen && !menuOpen) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && (e.target as Element).closest?.('[data-scp-pop]')) return
      setHistoryOpen(false)
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [historyOpen, menuOpen])

  useEffect(() => () => recognition.current?.stop(), [])

  const ask = (text: string) => {
    send(text)
    inputRef.current?.focus()
  }

  const newChat = () => {
    reset()
    setStored(readHistory())
    setActiveChatId(Date.now())
    setMenuOpen(false)
    inputRef.current?.focus()
  }

  const openSaved = (chat: SavedChat) => {
    setStored(readHistory())
    load(chat.messages)
    setActiveChatId(chat.id)
    setHistoryOpen(false)
  }

  const clearHistory = () => {
    // Clears past chats; the open conversation stays.
    writeHistory(current ? [stored.find((c) => c.id === current.id) ?? current] : [])
    setStored([])
    setMenuOpen(false)
  }

  const toggleMic = () => {
    if (!SpeechRecognitionCtor) return
    if (listening) {
      recognition.current?.stop()
      return
    }
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'en-IN'
    rec.interimResults = true
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join('')
      setInput(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognition.current = rec
    setListening(true)
    rec.start()
  }

  const topics = allTopics ? TOPICS : TOPICS.slice(0, VISIBLE_TOPICS)

  return (
    <div className="scp-page">
      <SiteTopNav />
      <main className="scp-wrap">

        <header className="scp-intro">
          <span className="scp-intro-icon"><ChatAssistantIcon size={46} /></span>
          <div>
            <h1>PhoneFix <em>AI Assistant</em> <Sparkles className="scp-intro-spark" aria-hidden="true" /></h1>
            <p>Get instant help for repairs, orders, warranty, and product support.</p>
          </div>
        </header>

        <div className="scp-grid">
          {/* ── Chat ── */}
          <section className={`scp-chat${started ? '' : ' is-welcome'}`} aria-label="Chat with PhoneFix AI Assistant">
            <div className="scp-chat-tools">
              {started && (
                <span className="scp-online"><i aria-hidden="true" /> PhoneFix AI · Online</span>
              )}
              <div className="scp-pop-wrap" data-scp-pop>
                <button
                  type="button"
                  className="scp-tool-btn"
                  aria-expanded={historyOpen}
                  onClick={() => { setHistoryOpen((o) => !o); setMenuOpen(false) }}
                >
                  <History aria-hidden="true" /> Chat History
                </button>
                {historyOpen && (
                  <div className="scp-pop scp-history" role="dialog" aria-label="Chat history">
                    <div className="scp-pop-head">
                      <strong>Recent chats</strong>
                      <button type="button" aria-label="Close" onClick={() => setHistoryOpen(false)}><X /></button>
                    </div>
                    {history.length === 0 ? (
                      <p className="scp-pop-empty">No saved chats yet. Ask a question to start one.</p>
                    ) : (
                      <ul>
                        {history.map((c) => (
                          <li key={c.id}>
                            <button type="button" className={c.id === activeChatId ? 'is-active' : ''} onClick={() => openSaved(c)}>
                              <MessageCircle aria-hidden="true" />
                              <span>
                                <strong>{c.title}</strong>
                                <small>{c.savedAt ? new Date(c.savedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Current chat'}</small>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div className="scp-pop-wrap" data-scp-pop>
                <button
                  type="button"
                  className="scp-tool-btn scp-tool-btn--icon"
                  aria-label="More options"
                  aria-expanded={menuOpen}
                  onClick={() => { setMenuOpen((o) => !o); setHistoryOpen(false) }}
                >
                  <MoreVertical aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div className="scp-pop scp-menu" role="menu">
                    <button type="button" role="menuitem" onClick={newChat}><Plus /> New chat</button>
                    <a role="menuitem" href={`tel:${SUPPORT_PHONE_DIAL}`}><Phone /> Call support</a>
                    <button type="button" role="menuitem" onClick={clearHistory} disabled={history.length === 0}><X /> Clear history</button>
                  </div>
                )}
              </div>
            </div>

            <div className="scp-body" ref={scrollRef} aria-live="polite">
              {!started ? (
                <div className="scp-welcome">
                  <div className="scp-robot">
                    <span className="scp-robot-lines" aria-hidden="true"><i /><i /><i /></span>
                    <ChatAssistantIcon size={124} />
                  </div>
                  <h2>Hello! I’m <em>PhoneFix AI</em></h2>
                  <p>How can I help you today?</p>

                  <div className="scp-actions">
                    {ACTIONS.map(({ icon: Icon, title, desc, ask: q }) => (
                      <button key={title} type="button" className="scp-action" onClick={() => ask(q)} disabled={typing}>
                        <Icon aria-hidden="true" />
                        <strong>{title}</strong>
                        <span>{desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="scp-popular">
                    <h3><TrendingUp aria-hidden="true" /> Popular questions</h3>
                    <div className="scp-chips">
                      {POPULAR.map((q) => (
                        <button key={q} type="button" onClick={() => ask(q)} disabled={typing}>{q}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="scp-messages">
                  {messages.map((m) => (
                    <div key={m.id} className={`scp-msg scp-msg--${m.from}`}>
                      {m.from === 'bot' && <span className="scp-msg-avatar"><ChatAssistantIcon size={24} /></span>}
                      <div className="scp-bubble">
                        <p>{m.text}</p>
                        <time>{m.time}</time>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="scp-msg scp-msg--bot">
                      <span className="scp-msg-avatar"><ChatAssistantIcon size={24} /></span>
                      <div className="scp-bubble scp-typing" aria-label="Assistant is typing"><i /><i /><i /></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form
              className="scp-input"
              onSubmit={(e) => {
                e.preventDefault()
                recognition.current?.stop()
                send(input)
              }}
            >
              {started && (
                <button type="button" className="scp-input-side" onClick={newChat} aria-label="New chat" title="New chat">
                  <Plus aria-hidden="true" />
                </button>
              )}
              <div className={`scp-field${listening ? ' is-listening' : ''}`}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={listening ? 'Listening…' : 'Type your question here...'}
                  aria-label="Type your question"
                  autoComplete="off"
                />
                {SpeechRecognitionCtor && (
                  <button
                    type="button"
                    className="scp-mic"
                    onClick={toggleMic}
                    aria-label={listening ? 'Stop voice input' : 'Speak your question'}
                    aria-pressed={listening}
                  >
                    <Mic aria-hidden="true" />
                  </button>
                )}
              </div>
              <button type="submit" className="scp-send" aria-label="Send message" disabled={!input.trim() || typing}>
                <Send aria-hidden="true" />
              </button>
            </form>
          </section>

          {/* ── Side ── */}
          <aside className="scp-side">
            <div className="scp-promo">
              <div>
                <h2><em>AI</em> Powered Support</h2>
                <ul>
                  <li><CircleCheck aria-hidden="true" /> Instant answers</li>
                  <li><CircleCheck aria-hidden="true" /> Personalized help</li>
                  <li><CircleCheck aria-hidden="true" /> 24/7 assistance</li>
                </ul>
              </div>
              <span className="scp-promo-bot" aria-hidden="true">
                <i className="scp-promo-ray scp-promo-ray--a" />
                <i className="scp-promo-ray scp-promo-ray--b" />
                <ChatAssistantIcon size={120} />
              </span>
            </div>

            <div className="scp-card">
              <h2 className="scp-card-title">More ways to get help</h2>
              <div className="scp-ways">
                <a href={`tel:${SUPPORT_PHONE_DIAL}`} className="scp-way">
                  <strong><Phone aria-hidden="true" /> Call Us</strong>
                  <span>{SUPPORT_PHONE}</span>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="scp-way scp-way--wa">
                  <strong><MessageCircle aria-hidden="true" /> WhatsApp</strong>
                  <span>Chat instantly</span>
                </a>
                <button type="button" className="scp-way" onClick={() => inputRef.current?.focus()}>
                  <strong><MessagesSquare aria-hidden="true" /> Live Chat</strong>
                  <span>Talk to an expert</span>
                </button>
              </div>
            </div>

            <div className="scp-card">
              <div className="scp-card-head">
                <h2 className="scp-card-title"><BookOpen aria-hidden="true" /> Explore Help Topics</h2>
                <button type="button" className="scp-view-all" onClick={() => setAllTopics((v) => !v)} aria-expanded={allTopics}>
                  {allTopics ? 'Show less' : 'View All'} <ArrowRight aria-hidden="true" className={allTopics ? 'is-up' : ''} />
                </button>
              </div>
              <ul className="scp-topics">
                {topics.map(({ icon: Icon, label, ask: q }) => (
                  <li key={label}>
                    <button type="button" onClick={() => ask(q)} disabled={typing}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      <ChevronRight aria-hidden="true" className="scp-topic-arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
