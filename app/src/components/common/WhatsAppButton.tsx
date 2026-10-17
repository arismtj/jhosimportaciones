import { useEffect, useRef, useState } from 'react'
import { advisors, type Advisor } from '../../config/checkout'
import { contactTopics, topicMessage } from '../../config/contactTopics'
import { whatsappLink } from '../../config/whatsapp'
import { trackEvent } from '../../services/analytics'

function ChatIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/></svg>
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false)
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [opened, setOpened] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('mousedown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('mousedown', close)
    }
  }, [open])

  const toggle = () => {
    setOpen((value) => !value)
    setAdvisor(null)
    setOpened('')
  }

  return (
    <div className="assistant" ref={rootRef}>
      {open && (
        <div className="assistant-panel wa-panel" role="dialog" aria-labelledby="waTitle">
          <div className="assistant-header">
            <span className="assistant-avatar" aria-hidden="true">J</span>
            <div><strong id="waTitle">Escríbenos por WhatsApp</strong><small><span className="assistant-online" aria-hidden="true" />{advisor ? `Asesor · ${advisor.label}` : 'Elige con quién hablar'}</small></div>
            <button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
          </div>

          <div className="wa-body">
            {!advisor ? (
              <>
                <p className="wa-step">1. Elige un asesor</p>
                {advisors.map((item, index) => (
                  <button type="button" className="wa-advisor" key={item.whatsapp} onClick={() => setAdvisor(item)}>
                    <span className="wa-advisor-dot" aria-hidden="true" />
                    <span><small>Asesor {index + 1}</small>{item.label}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="wa-step-row">
                  <p className="wa-step">2. ¿Sobre qué quieres consultar?</p>
                  <button type="button" className="link-button" onClick={() => { setAdvisor(null); setOpened('') }}>Cambiar número</button>
                </div>
                <div className="wa-topics">
                  {contactTopics.map((topic) => (
                    <a key={topic.id} href={whatsappLink(advisor.whatsapp, topicMessage(topic.message))} target="_blank" rel="noopener noreferrer" onClick={() => { setOpened(topic.label); trackEvent('contact_whatsapp', { topic: topic.id, advisor: advisor.label }) }}>
                      <span aria-hidden="true">{topic.icon}</span>{topic.label}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className={`assistant-hint wa-hint${opened ? ' done' : ''}`} role="status">
            {opened
              ? <>Abrimos WhatsApp con tu consulta sobre «{opened}». <strong>Toca «Enviar» en WhatsApp</strong> para que el asesor la reciba.</>
              : <>Se abrirá WhatsApp con tu mensaje listo. <strong>Toca «Enviar» en WhatsApp</strong> para que llegue al asesor.</>}
          </p>
        </div>
      )}
      <button type="button" className={`assistant-toggle${open ? ' open' : ''}`} onClick={toggle} aria-expanded={open} aria-label={open ? 'Cerrar WhatsApp' : 'Escríbenos por WhatsApp'}>
        {open ? <span className="assistant-x" aria-hidden="true">×</span> : <ChatIcon />}
        {!open && <span className="assistant-label">WhatsApp</span>}
      </button>
    </div>
  )
}
