'use client'
import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Sou o assistente da Gabinete FC. Como posso ajudar?',
}

// TODO Sprint 5: Integrar com Claude API (ANTHROPIC_API_KEY)
export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    // Stub: resposta automática básica
    await new Promise(r => setTimeout(r, 800))
    const botMsg: Message = {
      role: 'assistant',
      content: 'Entendi! Em breve nossa equipe entra em contato. Você também pode nos enviar um email para tecnologia@unfoldgrowth.com.br.',
    }
    setMessages(m => [...m, botMsg])
    setLoading(false)
  }

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors z-50 shadow-lg"
        aria-label="Suporte"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-card border border-border flex flex-col z-50 shadow-2xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-secondary">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">Suporte</p>
              <p className="text-[10px] text-muted-foreground">Gabinete FC</p>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 text-xs normal-case tracking-normal leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground border border-border'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-border px-3 py-2 text-xs text-muted-foreground">
                  Digitando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border flex">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Mensagem..."
              className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground normal-case tracking-normal"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 text-primary hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
