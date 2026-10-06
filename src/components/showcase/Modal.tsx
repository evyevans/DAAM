'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, eyebrow, onClose, children, wide = false }: { title: string; eyebrow?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const siblings = Array.from(panel.current?.parentElement?.parentElement?.children || []).filter(node => node !== panel.current?.parentElement) as HTMLElement[]
    const prior = siblings.map(node => node.inert)
    siblings.forEach(node => { node.inert = true })
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]') || [])
    focusable()[0]?.focus()
    function keydown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return }
      if (e.key === 'Tab') {
        const nodes = focusable(), first = nodes[0], last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = oldOverflow; siblings.forEach((node, index) => { node.inert = prior[index] }); requestAnimationFrame(() => { if (previous?.isConnected) previous.focus({ preventScroll: true }); else document.getElementById('workspace-main')?.focus({ preventScroll: true }) }) }
  }, [])
  return <div className="daam-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className={`daam-modal ${wide ? 'wide' : ''}`} ref={panel} role="dialog" aria-modal="true" aria-labelledby={id}>
      <header className="modal-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={id}>{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></header>
      {children}
    </div>
  </div>
}
