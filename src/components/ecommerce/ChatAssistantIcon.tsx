type ChatAssistantIconProps = {
  className?: string
  size?: number
}

export default function ChatAssistantIcon({ className, size = 24 }: ChatAssistantIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 5.8A2.8 2.8 0 0 0 17.2 3H6.8A2.8 2.8 0 0 0 4 5.8v7.4A2.8 2.8 0 0 0 6.8 16H8v3.05a.7.7 0 0 0 1.14.54L13.3 16h3.9A2.8 2.8 0 0 0 20 13.2V5.8Z" />
      <path
        d="M12 7.1l1.05 2.55L15.6 10.7l-2.55 1.05L12 14.3l-1.05-2.55L8.4 10.7l2.55-1.05L12 7.1Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
