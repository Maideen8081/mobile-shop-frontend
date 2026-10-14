import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Truck, Wrench } from 'lucide-react'
import { sendChatMessage } from '../../services/chatService'

// Chat state and canned content shared by SupportChatPage and MobileSupportChat.

export type ChatMessage = {
  id: number
  from: 'bot' | 'user'
  text: string
  time: string
}

export const SUPPORT_PHONE = '+91 98765 43210'
export const SUPPORT_PHONE_DIAL = '+919876543210'

export const quickReplies = [
  'Book a repair',
  'Track my order',
  'Warranty information',
  'Shipping & delivery',
  'Talk to a human',
]

export const helpLinks = [
  {
    to: '/book-repair',
    icon: Wrench,
    title: 'Book a repair',
    desc: 'Pick your device and a slot',
  },
  {
    to: '/orders',
    icon: Truck,
    title: 'Track your order',
    desc: 'Live status and delivery date',
  },
  {
    to: '/repairs',
    icon: ShieldCheck,
    title: 'Warranty & services',
    desc: 'Coverage and repair options',
  },
]

const timeNow = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

function botReply(raw: string): string {
  const t = raw.toLowerCase()
  if (/(hi|hello|hey|namaste|good (morning|afternoon|evening))/.test(t))
    return 'Hello! 👋 Welcome to PhoneFix. I can help with repairs, orders, warranty and product questions. What do you need today?'
  if (/(book|repair|fix|broken|crack|screen|battery|water|charging|hang)/.test(t))
    return 'I can help you book a repair 🔧. Open the Book Repair page, choose your device, describe the issue and pick a slot. Most screen and battery repairs are done the same day. Want to start a booking?'
  if (/(track|order|delivery|ship|where is|status|dispatch|parcel)/.test(t))
    return 'You can track any order from the Orders page — it shows live status, courier details and the expected delivery date 📦. Share your order ID if you want me to point you to it.'
  if (/(warranty|guarantee|covered|coverage)/.test(t))
    return 'Every repair includes a 6-month service warranty, and refurbished devices carry a 12-month PhoneFix warranty 🛡️. Keep your invoice safe — that is your warranty proof.'
  if (/(price|cost|how much|charge|rate|quote|estimate)/.test(t))
    return 'Repair pricing depends on the device and part. Screen replacements typically start around ₹1,499 and battery replacements around ₹999 💰. Open Book Repair and select your model for an exact quote.'
  if (/(refurb|second hand|second-hand|used|renewed|pre-?owned)/.test(t))
    return 'Our certified refurbished devices are fully tested, cleaned and come with original-grade accessories plus a 12-month warranty. Flagship performance at a fraction of the price ♻️.'
  if (/(return|refund|exchange|cancel)/.test(t))
    return 'Unused products can be returned within 7 days of delivery, and refunds reach your original payment method within 5–7 business days. Would you like the returns help page?'
  if (/(human|agent|call|talk|phone|whatsapp|contact|support|help me)/.test(t))
    return `Of course — our team is available 10 AM to 8 PM. Call or WhatsApp ${SUPPORT_PHONE}, or use the contact links in the footer. I can also keep helping you right here 🙂.`
  if (/(thank|thanks|great|awesome|perfect|nice)/.test(t))
    return 'Happy to help! 😊 Anything else you would like to know about your device or order?'
  return 'Thanks for your message! I can help with repairs, order tracking, warranty, pricing, refurbished devices and returns. Could you tell me a little more about what you need?'
}

export function useSupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: 'bot',
      text: "Hi, I'm the PhoneFix Assistant ✨. Ask me about repairs, orders, warranty or products — or pick a topic below.",
      time: timeNow(),
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(2)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || typing) return
    const history = messages.map((m) => ({
      role: m.from === 'bot' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }))
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, from: 'user', text, time: timeNow() },
    ])
    setInput('')
    setTyping(true)
    let reply: string
    try {
      reply = await sendChatMessage(text, history)
    } catch {
      reply = botReply(text)
    }
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, from: 'bot', text: reply, time: timeNow() },
    ])
    setTyping(false)
  }

  return { messages, input, setInput, typing, scrollRef, send }
}
