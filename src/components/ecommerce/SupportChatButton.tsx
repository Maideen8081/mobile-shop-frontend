import { Link, useLocation } from 'react-router-dom'
import ChatAssistantIcon from './ChatAssistantIcon'
import './SupportChatButton.css'

export default function SupportChatButton() {
  const { pathname } = useLocation()

  if (pathname === '/support') return null

  return (
    <Link
      to="/support"
      aria-label="Open the PhoneFix chat assistant"
      className="support-chat-button"
    >
      <span className="support-chat-button-inner">
        <span className="support-chat-button-ring" aria-hidden="true" />
        <ChatAssistantIcon size={26} />
      </span>
    </Link>
  )
}
