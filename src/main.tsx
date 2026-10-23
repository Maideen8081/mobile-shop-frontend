import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/sora'
import './index.css'
import App from './App.tsx'
import { clearGuestWishlist } from './utils/wishlist'

// Remove any wishlist saved before sign-in (or left by an expired session).
clearGuestWishlist()
window.addEventListener('auth-changed', clearGuestWishlist)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
