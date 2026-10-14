import { Link } from 'react-router-dom'
import { ArrowLeft, Phone, Send } from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import ChatAssistantIcon from '../components/ecommerce/ChatAssistantIcon'
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DIAL,
  helpLinks,
  quickReplies,
  useSupportChat,
} from '../components/ecommerce/useSupportChat'
import './SupportChatPage.css'

export default function SupportChatPage() {
  const { messages, input, setInput, typing, scrollRef, send } = useSupportChat()

  return (
    <div className="scp-page">
      <SiteTopNav />
      <main className="scp-wrap">
        <div className="scp-container">
          <Link to="/" className="scp-back">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>

          <div className="scp-intro">
            <div className="scp-intro-icon">
              <ChatAssistantIcon size={22} />
            </div>
            <div>
              <h1>PhoneFix Assistant</h1>
              <p>Your helper for repairs, orders, warranty and products.</p>
            </div>
          </div>

          <div className="scp-grid">
            <section className="scp-shell" aria-label="Chat with PhoneFix Assistant">
              <header className="scp-chat-head">
                <span className="scp-avatar">
                  <ChatAssistantIcon size={22} />
                </span>
                <div className="scp-chat-id">
                  <strong>PhoneFix Assistant</strong>
                  <span className="scp-status">
                    <i aria-hidden="true" /> Online · replies instantly
                  </span>
                </div>
                <a className="scp-call" href={`tel:${SUPPORT_PHONE_DIAL}`}>
                  <Phone aria-hidden="true" />
                  <span>Call</span>
                </a>
              </header>

              <div className="scp-messages" ref={scrollRef} aria-live="polite">
                {messages.map((m) => (
                  <div key={m.id} className={`scp-msg scp-msg--${m.from}`}>
                    {m.from === 'bot' && (
                      <span className="scp-msg-avatar">
                        <ChatAssistantIcon size={18} />
                      </span>
                    )}
                    <div className="scp-bubble">
                      <p>{m.text}</p>
                      <time>{m.time}</time>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="scp-msg scp-msg--bot">
                    <span className="scp-msg-avatar">
                      <ChatAssistantIcon size={18} />
                    </span>
                    <div className="scp-bubble scp-typing" aria-label="Assistant is typing">
                      <i /> <i /> <i />
                    </div>
                  </div>
                )}
              </div>

              {messages.length <= 1 && (
                <div className="scp-quick">
                  {quickReplies.map((q) => (
                    <button key={q} type="button" onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="scp-input"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  aria-label="Type your message"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || typing}
                >
                  <Send aria-hidden="true" />
                </button>
              </form>

              <p className="scp-note">
                Automated assistant · for urgent help call{' '}
                <a href={`tel:${SUPPORT_PHONE_DIAL}`}>{SUPPORT_PHONE}</a>
              </p>
            </section>

            <aside className="scp-help">
              <h2>Popular help</h2>
              {helpLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.to} to={item.to} className="scp-help-card">
                    <span className="scp-help-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.desc}</em>
                    </span>
                  </Link>
                )
              })}
              <a className="scp-help-card scp-help-card--call" href={`tel:${SUPPORT_PHONE_DIAL}`}>
                <span className="scp-help-icon">
                  <Phone aria-hidden="true" />
                </span>
                <span>
                  <strong>Call support</strong>
                  <em>{SUPPORT_PHONE}</em>
                </span>
              </a>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
