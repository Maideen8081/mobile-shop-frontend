import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Send, ChevronRight } from 'lucide-react'
import ChatAssistantIcon from '../ecommerce/ChatAssistantIcon'
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DIAL,
  helpLinks,
  quickReplies,
  useSupportChat,
} from '../ecommerce/useSupportChat'

const PURPLE = '#CB202D'
const gradient = 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)'

export default function MobileSupportChat() {
  const navigate = useNavigate()
  const { messages, input, setInput, typing, scrollRef, send } = useSupportChat()
  const showStarters = messages.length <= 1

  return (
    <div className="h-[100dvh] bg-[#FFFBFB] max-w-[480px] mx-auto flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 text-white"
        style={{ background: gradient, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-9 h-9 rounded-[8px] bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <ChatAssistantIcon size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-body font-bold leading-tight truncate">PhoneFix Assistant</h1>
            <p className="text-micro text-white/85 mt-0.5 flex items-center gap-1.5 truncate">
              <i className="w-2 h-2 rounded-full bg-[#22C55E] inline-block flex-shrink-0" aria-hidden="true" />
              Online · replies instantly
            </p>
          </div>
          <a
            href={`tel:${SUPPORT_PHONE_DIAL}`}
            aria-label={`Call support ${SUPPORT_PHONE}`}
            className="w-9 h-9 rounded-[8px] bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0"
          >
            <Phone size={17} />
          </a>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2 space-y-3" aria-live="polite">
        {messages.map((m) =>
          m.from === 'bot' ? (
            <div key={m.id} className="flex items-end gap-2 max-w-[88%]">
              <span className="w-7 h-7 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center flex-shrink-0">
                <ChatAssistantIcon size={16} />
              </span>
              <div className="bg-white rounded-2xl rounded-bl-[6px] px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] min-w-0">
                <p className="text-body-sm leading-snug text-[#1F2937] whitespace-pre-wrap break-words">{m.text}</p>
                <time className="block text-micro text-[#9CA3AF] mt-1">{m.time}</time>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-[6px] px-3.5 py-2.5 text-white shadow-[0_4px_14px_rgba(203,32,45,0.25)]" style={{ background: gradient }}>
                <p className="text-body-sm leading-snug whitespace-pre-wrap break-words">{m.text}</p>
                <time className="block text-micro text-white/75 mt-1 text-right">{m.time}</time>
              </div>
            </div>
          ),
        )}

        {typing && (
          <div className="flex items-end gap-2" aria-label="Assistant is typing">
            <span className="w-7 h-7 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center flex-shrink-0">
              <ChatAssistantIcon size={16} />
            </span>
            <div className="bg-white rounded-2xl rounded-bl-[6px] px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex gap-1">
              {[0, 150, 300].map((d) => (
                <i key={d} className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        {showStarters && (
          <div className="pt-3">
            <h2 className="text-micro font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Popular help</h2>
            <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] divide-y divide-[#F3F4F6] overflow-hidden">
              {helpLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-3 active:bg-[#FFF5F5]">
                    <span className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>
                      <Icon size={17} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <strong className="block text-label font-semibold text-[#1F2937] truncate">{item.title}</strong>
                      <em className="block not-italic text-micro text-[#6B7280] truncate">{item.desc}</em>
                    </span>
                    <ChevronRight size={16} className="text-[#D1D5DB] flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      {showStarters && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="flex-shrink-0 h-9 px-3.5 rounded-full bg-white border text-caption font-semibold whitespace-nowrap active:scale-95 transition"
              style={{ borderColor: 'rgba(203,32,45,0.3)', color: PURPLE }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-[#EEF0F6] px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <form
          className="flex items-center gap-2"
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
            enterKeyHint="send"
            className="flex-1 min-w-0 h-11 px-4 rounded-full bg-[#F7F7F9] border border-[#EEF0F6] text-body text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:border-[#CB202D]"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || typing}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 active:scale-90 transition disabled:opacity-40"
            style={{ background: gradient }}
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-micro text-[#9CA3AF] text-center mt-1.5">
          Automated assistant · urgent help:{' '}
          <a href={`tel:${SUPPORT_PHONE_DIAL}`} className="font-semibold" style={{ color: PURPLE }}>{SUPPORT_PHONE}</a>
        </p>
      </div>
    </div>
  )
}
