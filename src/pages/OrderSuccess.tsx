import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileOrderSuccess from '../components/mobile/MobileOrderSuccess'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const emojiToImage: Record<string, string> = {
  '📱': 'https://pngimg.com/d/iphone16_PNG37.png',
  '📲': 'https://pngimg.com/d/samsung_PNG2.png',
  '🎧': 'https://pngimg.com/d/headphones_PNG7645.png',
  '⌚': 'https://pngimg.com/d/apple_watch_PNG19558.png',
  '📟': 'https://pngimg.com/d/ipad_PNG2133.png',
  '💻': 'https://pngimg.com/d/laptop_PNG101814.png',
  '🎮': 'https://pngimg.com/d/ps5_PNG31.png',
  '📷': 'https://pngimg.com/d/camera_PNG101583.png',
  '🛡️': 'https://pngimg.com/d/iphone15_PNG40.png',
}

function resolveImage(item: OrderItem): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    const mapped = emojiToImage[item.image]
    if (mapped) return mapped
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  if (item.emoji && emojiToImage[item.emoji]) return emojiToImage[item.emoji]
  return ''
}

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function OrderSuccess() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileOrderSuccess />
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [orderData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('last_order')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const orderId = params.get('order_id') || orderData?.orderId || 'ORD-' + String(Math.random()).slice(2, 10).toUpperCase()
  const deliveryDate = orderData?.deliveryDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  })()
  const items: OrderItem[] = orderData?.items || []
  const total = orderData?.total ?? items.reduce((s, i) => s + i.price * i.quantity, 0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  const displayOrderId = orderId.startsWith('ORD-') ? `LX–${orderId.slice(4).padStart(6, '0')}` : `LX–${orderId}`

  return (
    <>
      <style>{`
        :root{
          --paper:#FBF8F6;
          --white:#FFFFFF;
          --ink:#221614;
          --ink-soft:#6b5c59;
          --red:#7A1620;
          --red-bright:#B4222F;
          --red-tint:#F7E9E7;
          --line:#E8DEDB;
          --gold:#A9832E;
        }
        .os-body{
          margin:0;
          background:
            radial-gradient(1200px 600px at 15% -10%, #fff 0%, var(--paper) 45%),
            var(--paper);
          color:var(--ink);
          font-family:'Inter',sans-serif;
          -webkit-font-smoothing:antialiased;
          min-height:100vh;
          display:flex;
          flex-direction:column;
        }
        .os-main{
          max-width:760px;
          margin:0 auto;
          padding:40px clamp(20px,5vw,64px) 80px;
          flex:1;
          width:100%;
        }
        .os-seal-wrap{
          display:flex;
          flex-direction:column;
          align-items:center;
          margin-bottom:28px;
        }
        .os-seal{
          width:120px;
          height:120px;
          animation:osStamp 800ms cubic-bezier(.2,1.6,.4,1) both;
          filter:drop-shadow(0 12px 24px rgba(122,22,32,0.35));
        }
        @keyframes osStamp{
          0%{transform:scale(2.5) rotate(-20deg);opacity:0;}
          60%{transform:scale(0.92) rotate(4deg);opacity:1;}
          100%{transform:scale(1) rotate(0deg);opacity:1;}
        }
        .os-seal-glow{
          position:absolute;
          width:160px;
          height:160px;
          border-radius:50%;
          background:radial-gradient(circle, rgba(180,34,47,0.2) 0%, transparent 70%);
          animation:osGlow 2s ease-in-out infinite;
        }
        @keyframes osGlow{
          0%,100%{transform:scale(1);opacity:0.5;}
          50%{transform:scale(1.15);opacity:0.8;}
        }
        .os-eyebrow{
          margin-top:24px;
          font-family:'IBM Plex Mono',monospace;
          font-size:11px;
          letter-spacing:0.2em;
          color:var(--red-bright);
          text-transform:uppercase;
          font-weight:500;
        }
        .os-h1{
          font-family:'Fraunces',serif;
          font-weight:500;
          font-size:clamp(32px,5vw,48px);
          text-align:center;
          margin:16px 0 14px;
          letter-spacing:-0.01em;
          line-height:1.1;
        }
        .os-lede{
          text-align:center;
          color:var(--ink-soft);
          font-size:15.5px;
          line-height:1.7;
          max-width:440px;
          margin:0 auto 48px;
        }
        .os-receipt{
          background:var(--white);
          border:1px solid var(--line);
          border-radius:6px;
          position:relative;
          box-shadow:
            0 1px 3px rgba(34,22,20,0.04),
            0 8px 24px rgba(34,22,20,0.06),
            0 24px 48px rgba(34,22,20,0.04);
        }
        .os-receipt-accent{
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:3px;
          background:linear-gradient(90deg, var(--red), var(--red-bright) 50%, var(--gold));
          border-radius:6px 6px 0 0;
        }
        .os-receipt-top{
          display:flex;
          justify-content:space-between;
          padding:32px 36px 28px;
        }
        .os-field-label{
          font-family:'IBM Plex Mono',monospace;
          font-size:10px;
          letter-spacing:0.14em;
          color:var(--ink-soft);
          text-transform:uppercase;
          margin-bottom:10px;
        }
        .os-field-value{
          font-family:'IBM Plex Mono',monospace;
          font-size:18px;
          font-weight:500;
          color:var(--ink);
        }
        .os-field-value.right{text-align:right;}
        .os-perforation{
          position:relative;
          height:1px;
          background:var(--line);
          margin:0;
        }
        .os-perforation::before,.os-perforation::after{
          content:'';
          position:absolute;
          top:-9px;
          width:18px;
          height:18px;
          border-radius:50%;
          background:var(--paper);
          border:1px solid var(--line);
        }
        .os-perforation::before{left:-10px;}
        .os-perforation::after{right:-10px;}
        .os-perf-line{
          display:flex;
          margin:0 28px;
          border-top:1px dashed var(--line);
        }
        .os-progress-block{padding:28px 36px 30px;}
        .os-progress-header{display:flex;justify-content:space-between;margin-bottom:18px;}
        .os-status-text{font-size:13px;font-weight:600;color:var(--ink);}
        .os-status-pct{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--red-bright);font-weight:500;}
        .os-track{position:relative;height:3px;background:var(--red-tint);border-radius:3px;overflow:hidden;}
        .os-track-fill{
          position:absolute;
          left:0;top:0;height:100%;
          background:linear-gradient(90deg, var(--red), var(--red-bright));
          border-radius:3px;
          width:88%;
          animation:osTrackFill 1.5s cubic-bezier(0.4,0,0.2,1) both;
        }
        @keyframes osTrackFill{
          0%{width:0%;}
          100%{width:88%;}
        }
        .os-milestones{display:flex;justify-content:space-between;margin-top:14px;}
        .os-milestone{
          font-size:10.5px;
          color:var(--ink-soft);
          text-align:center;
          width:20%;
          position:relative;
        }
        .os-milestone.done{color:var(--red-bright);font-weight:600;}
        .os-milestone.done::before{
          content:'';
          position:absolute;
          top:-18px;
          left:50%;
          transform:translateX(-50%);
          width:6px;
          height:6px;
          border-radius:50%;
          background:var(--red-bright);
        }
        .os-items{padding:8px 36px 10px;}
        .os-item{
          display:flex;
          align-items:center;
          gap:18px;
          padding:20px 0;
          border-bottom:1px solid var(--line);
        }
        .os-item:last-child{border-bottom:none;}
        .os-item-thumb{
          width:56px;height:56px;
          border-radius:8px;
          overflow:hidden;
          flex-shrink:0;
          border:1px solid var(--line);
          background:var(--paper);
          display:flex;
          align-items:center;
          justify-content:center;
          transition:transform 0.2s ease;
        }
        .os-item-thumb:hover{transform:scale(1.05);}
        .os-item-thumb img{width:100%;height:100%;object-fit:cover;}
        .os-item-info{flex:1;min-width:0;}
        .os-item-name{
          font-family:'Fraunces',serif;
          font-size:17px;
          font-weight:500;
          margin-bottom:4px;
          color:var(--ink);
        }
        .os-item-meta{
          font-size:12px;
          color:var(--ink-soft);
          font-family:'IBM Plex Mono',monospace;
          letter-spacing:0.02em;
        }
        .os-item-price{
          font-family:'IBM Plex Mono',monospace;
          font-size:14.5px;
          font-weight:500;
          color:var(--ink);
          white-space:nowrap;
        }
        .os-total-row{
          display:flex;
          justify-content:space-between;
          align-items:baseline;
          padding:28px 36px;
          background:linear-gradient(135deg, rgba(122,22,32,0.02) 0%, rgba(169,131,46,0.02) 100%);
          border-top:2px solid var(--ink);
          border-radius:0 0 6px 6px;
        }
        .os-total-label{
          font-family:'IBM Plex Mono',monospace;
          font-size:11px;
          letter-spacing:0.14em;
          color:var(--ink-soft);
          text-transform:uppercase;
        }
        .os-total-value{
          font-family:'Fraunces',serif;
          font-size:32px;
          font-weight:600;
          color:var(--red);
        }
        .os-actions{
          display:flex;
          gap:16px;
          justify-content:center;
          margin-top:44px;
          flex-wrap:wrap;
        }
        .os-btn{
          font-family:'Inter',sans-serif;
          font-weight:600;
          font-size:14.5px;
          padding:16px 36px;
          border-radius:4px;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:10px;
          transition:all 0.2s ease;
          border:1px solid transparent;
          letter-spacing:0.01em;
        }
        .os-btn:active{transform:scale(0.98);}
        .os-btn-primary{
          background:linear-gradient(135deg, var(--red) 0%, var(--red-bright) 100%);
          color:var(--white);
          box-shadow:0 10px 28px rgba(122,22,32,0.3);
        }
        .os-btn-primary:hover{
          box-shadow:0 14px 36px rgba(122,22,32,0.4);
          transform:translateY(-1px);
        }
        .os-btn-ghost{
          background:transparent;
          color:var(--ink);
          border-color:var(--line);
        }
        .os-btn-ghost:hover{
          border-color:var(--ink);
          background:var(--white);
        }
        .os-trust-row{
          display:flex;
          justify-content:center;
          gap:40px;
          margin-top:48px;
          padding-top:32px;
          border-top:1px solid var(--line);
        }
        .os-trust-item{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:8px;
          font-family:'IBM Plex Mono',monospace;
          font-size:9.5px;
          letter-spacing:0.12em;
          color:var(--ink-soft);
          text-transform:uppercase;
        }
        .os-trust-icon{
          width:36px;
          height:36px;
          border-radius:50%;
          background:var(--red-tint);
          display:flex;
          align-items:center;
          justify-content:center;
          color:var(--red);
          font-size:16px;
        }
        @media(max-width:560px){
          .os-receipt-top{flex-direction:column;gap:18px;}
          .os-field-value.right{text-align:left;}
          .os-milestones{display:none;}
          .os-item-meta{display:block;}
          .os-trust-row{gap:24px;}
        }
      `}</style>

      <div className="os-body">
        <SiteTopNav />

        <main className="os-main" style={{paddingTop:'120px'}}>
          <div className="os-seal-wrap">
            <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div className="os-seal-glow" />
              <svg className="os-seal" viewBox="0 0 104 104" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Confirmed seal" style={{position:'relative',zIndex:1}}>
                <circle cx="52" cy="52" r="48" fill="#7A1620"/>
                <circle cx="52" cy="52" r="48" fill="none" stroke="#B4222F" strokeWidth="1" opacity="0.5"/>
                <circle cx="52" cy="52" r="40" fill="none" stroke="#F7E9E7" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
                <path d="M36 53 L47 64 L69 40" fill="none" stroke="#FBF9F7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="os-eyebrow">Confirmed &amp; Secured</div>
          </div>

          <h1 className="os-h1">Your order is confirmed</h1>
          <p className="os-lede">Thank you for your purchase. A copy of this receipt has been sent to your inbox, and we'll notify you the moment it ships.</p>

          <div className="os-receipt">
            <div className="os-receipt-accent" />
            <div className="os-receipt-top">
              <div>
                <div className="os-field-label">Order No.</div>
                <div className="os-field-value">{displayOrderId}</div>
              </div>
              <div>
                <div className="os-field-label">Estimated Delivery</div>
                <div className="os-field-value right">{deliveryDate}</div>
              </div>
            </div>

            <div className="os-perforation" />
            <div className="os-perf-line" />

            <div className="os-progress-block">
              <div className="os-progress-header">
                <span className="os-status-text">Payment confirmed &amp; processing</span>
                <span className="os-status-pct">88%</span>
              </div>
              <div className="os-track"><div className="os-track-fill" /></div>
              <div className="os-milestones">
                <div className="os-milestone done">Ordered</div>
                <div className="os-milestone done">Confirmed</div>
                <div className="os-milestone done">Processing</div>
                <div className="os-milestone">Shipped</div>
                <div className="os-milestone">Delivered</div>
              </div>
            </div>

            <div className="os-perf-line" />

            <div className="os-items">
              {items.length === 0 ? (
                <div style={{padding:'20px 0',textAlign:'center',color:'var(--ink-soft)',fontSize:'13px',fontFamily:"'IBM Plex Mono',monospace"}}>Order details loading...</div>
              ) : items.map(item => {
                const imgUrl = resolveImage(item)
                const hasImg = imgUrl && !imgErrors[item.productId]
                return (
                  <div key={item.productId} className="os-item">
                    <div className="os-item-thumb">
                      {hasImg ? (
                        <img src={imgUrl} alt={item.name} onError={() => setImgErrors(p => ({...p, [item.productId]: true}))} />
                      ) : (
                        <span style={{fontSize:'24px'}}>{item.emoji || '📦'}</span>
                      )}
                    </div>
                    <div className="os-item-info">
                      <div className="os-item-name">{item.name}</div>
                      <div className="os-item-meta">QTY {item.quantity}{item.storage ? ` · ${item.storage}` : ''}</div>
                    </div>
                    <div className="os-item-price">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                )
              })}
            </div>

            <div className="os-total-row">
              <span className="os-total-label">Total Paid</span>
              <span className="os-total-value">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="os-actions">
            <button className="os-btn os-btn-primary" onClick={() => navigate(`/orders?order_id=${orderId}`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Track Order
            </button>
            <button className="os-btn os-btn-ghost" onClick={() => navigate('/collection/all')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Continue Shopping
            </button>
          </div>

          <div className="os-trust-row">
            <div className="os-trust-item">
              <div className="os-trust-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              Secure Payment
            </div>
            <div className="os-trust-item">
              <div className="os-trust-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              Encrypted Checkout
            </div>
            <div className="os-trust-item">
              <div className="os-trust-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              24/7 Support
            </div>
          </div>
        </main>

        <EcommerceFooter compact />
      </div>
    </>
  )
}
