import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const T = {
  bg:'#07090F', card:'#0C0F1A', border:'rgba(255,255,255,.08)',
  borderHover:'rgba(255,255,255,.16)', accent:'#6366F1',
  txt:'#F1F5F9', sub:'#94A3B8', mute:'#475569',
  ok:'#22C55E', err:'#EF4444', warn:'#F59E0B',
  font:"'Sora',system-ui,sans-serif",
  mono:"'JetBrains Mono',monospace",
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.bg}}
  input{outline:none;-webkit-appearance:none}
  input::placeholder{color:${T.mute}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .auth-card{animation:fadeUp .4s ease both}
  .inp:focus{border-color:${T.accent}!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important}
  .btn-primary{transition:all .15s}
  .btn-primary:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 6px 24px rgba(99,102,241,.35)}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed}
  .btn-google{transition:all .15s}
  .btn-google:hover{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.18)!important}
  .link{color:${T.accent};cursor:pointer;font-weight:500;transition:opacity .12s}
  .link:hover{opacity:.75}
  @media(max-width:480px){
    .auth-wrapper{padding:20px 16px!important}
    .auth-card{padding:28px 22px!important}
  }
`

// ── Input field ──────────────────────────────────────────────
function Field({ label, type='text', value, onChange, placeholder, error, hint, icon }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'

  return (
    <div style={{marginBottom:16}}>
      <label style={{fontSize:11,color:T.sub,fontWeight:500,letterSpacing:'.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>
        {label}
      </label>
      <div style={{position:'relative'}}>
        {icon && (
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.mute,display:'flex'}}>
            {icon}
          </span>
        )}
        <input
          className="inp"
          type={isPass && !show ? 'password' : 'text'}
          value={value}
          onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={isPass ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={{
            width:'100%',
            background:'rgba(255,255,255,.04)',
            border:`1px solid ${error?T.err:T.border}`,
            borderRadius:10,
            padding:`11px ${isPass?'42px':'14px'} 11px ${icon?'40px':'14px'}`,
            color:T.txt,
            fontSize:14,
            fontFamily:T.font,
            transition:'border-color .15s, box-shadow .15s',
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={()=>setShow(s=>!s)}
            style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:T.mute,display:'flex',padding:0}}
          >
            {show
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.7A1.8 1.8 0 0 0 9.3 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 4.7C2.8 5.6 2 6.7 1.5 8c.9 2.6 3.6 4.5 6.5 4.5a7 7 0 0 0 2.7-.5M6.8 3.6A7 7 0 0 1 8 3.5c2.9 0 5.6 1.9 6.5 4.5-.3.9-.9 1.8-1.7 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="6.5" ry="4" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
            }
          </button>
        )}
      </div>
      {error && <p style={{fontSize:11,color:T.err,marginTop:5}}>{error}</p>}
      {hint && !error && <p style={{fontSize:11,color:T.mute,marginTop:5}}>{hint}</p>}
    </div>
  )
}

// ── Google OAuth button ──────────────────────────────────────
function GoogleBtn({ onClick, loading }) {
  return (
    <button
      className="btn-google"
      onClick={onClick}
      disabled={loading}
      style={{
        width:'100%', padding:'11px 0', borderRadius:10,
        border:`1px solid ${T.border}`, background:'transparent',
        color:T.txt, fontSize:13, fontWeight:500, fontFamily:T.font,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.22l6.87-6.87C35.64 2.38 30.18 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.45 13.02 17.73 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.2C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuar com Google
    </button>
  )
}

// ── Divisor ──────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0'}}>
      <div style={{flex:1,height:1,background:T.border}}/>
      <span style={{fontSize:11,color:T.mute}}>ou</span>
      <div style={{flex:1,height:1,background:T.border}}/>
    </div>
  )
}

// ── Alert box ────────────────────────────────────────────────
function Alert({ msg, type='error' }) {
  if (!msg) return null
  const cfg = {
    error: [T.err,'rgba(239,68,68,.08)','rgba(239,68,68,.2)','⚠'],
    success: [T.ok,'rgba(34,197,94,.08)','rgba(34,197,94,.2)','✓'],
    info: ['#60a5fa','rgba(96,165,250,.08)','rgba(96,165,250,.2)','ℹ'],
  }
  const [c,bg,bdr,ico] = cfg[type]||cfg.error
  return (
    <div style={{background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'flex-start'}}>
      <span style={{color:c,fontSize:13,flexShrink:0}}>{ico}</span>
      <p style={{fontSize:12,color:c,lineHeight:1.55}}>{msg}</p>
    </div>
  )
}

// ── Strength bar ─────────────────────────────────────────────
function StrengthBar({ pwd }) {
  if (!pwd) return null
  const s = pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) ? 4
    : pwd.length >= 8 && (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) ? 3
    : pwd.length >= 6 ? 2 : 1
  const labels = ['','Fraca','Razoável','Boa','Forte']
  const colors = ['','#EF4444','#F59E0B','#60a5fa','#22C55E']
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:'flex',gap:4,marginBottom:4}}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=s?colors[s]:'rgba(255,255,255,.08)',transition:'background .2s'}}/>
        ))}
      </div>
      <p style={{fontSize:10,color:colors[s]}}>{labels[s]}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AuthPage
// ══════════════════════════════════════════════════════════════
export default function AuthPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  const [mode, setMode]       = useState('login') // login | signup | reset | reset_sent
  const [loading, setLoading] = useState(false)
  const [alert, setAlert]     = useState(null)    // {msg, type}

  // Form fields
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [errors,   setErrors]   = useState({})

  const from = location.state?.from?.pathname || '/dashboard'

  const clearAll = () => { setErrors({}); setAlert(null) }
  const switchMode = (m) => { clearAll(); setMode(m) }

  // ── Validação ──────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (mode === 'signup' && !name.trim()) e.name = 'Nome é obrigatório'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    if (mode !== 'reset') {
      if (!password) e.password = 'Senha é obrigatória'
      else if (password.length < 8) e.password = 'Mínimo de 8 caracteres'
    }
    if (mode === 'signup' && password !== confirm) e.confirm = 'As senhas não coincidem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setAlert(null)

    try {
      if (mode === 'login') {
        const { error } = await signIn({ email, password })
        if (error) throw error
        navigate(from, { replace: true })

      } else if (mode === 'signup') {
        const { error } = await signUp({ email, password, name })
        if (error) throw error
        setAlert({ msg: 'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de fazer login.', type:'success' })
        setMode('login')

      } else if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setMode('reset_sent')
      }
    } catch (err) {
      const msg = err?.message || 'Algo deu errado. Tente novamente.'
      // Traduz mensagens comuns do Supabase
      const translations = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de fazer login.',
        'User already registered': 'Este e-mail já está cadastrado. Faça login.',
        'Password should be at least 6 characters': 'Senha muito curta (mínimo 8 caracteres).',
        'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
      }
      setAlert({ msg: translations[msg] || msg, type:'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setAlert({ msg: error.message, type:'error' })
      setLoading(false)
    }
    // Se ok, o Supabase redireciona automaticamente via OAuth
  }

  // ── Layout ─────────────────────────────────────────────────
  return (
    <div className="auth-wrapper" style={{
      minHeight:'100vh', background:T.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'40px 20px', fontFamily:T.font,
    }}>
      <style>{CSS}</style>

      {/* BG decoration */}
      <div style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,129,251,.08) 0%,transparent 70%)'}}/>
      </div>

      <div style={{width:'100%',maxWidth:420,position:'relative'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:46,height:46,borderRadius:13,background:T.accent,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14,boxShadow:'0 8px 32px rgba(99,102,241,.35)'}}>
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none"><path d="M2 11.5 7 2.5l5 9H2z" fill="white"/></svg>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:T.txt,letterSpacing:'-0.02em'}}>TrafficDesk</div>
          <div style={{fontSize:13,color:T.mute,marginTop:4}}>Gestão de performance e tráfego</div>
        </div>

        {/* Card */}
        <div className="auth-card" style={{
          background:T.card, borderRadius:18,
          border:`1px solid ${T.border}`,
          padding:'32px 36px',
          boxShadow:'0 24px 80px rgba(0,0,0,.5)',
        }}>
          {/* ── Reset sent ── */}
          {mode === 'reset_sent' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:16}}>📬</div>
              <h2 style={{fontSize:18,fontWeight:600,color:T.txt,marginBottom:8}}>E-mail enviado!</h2>
              <p style={{fontSize:13,color:T.sub,lineHeight:1.7,marginBottom:24}}>Verifique sua caixa de entrada e clique no link para redefinir sua senha. O link expira em 1 hora.</p>
              <button onClick={()=>switchMode('login')} className="btn-primary" style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:T.accent,color:'#fff',fontSize:14,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>
                Voltar para o login
              </button>
            </div>
          )}

          {/* ── Forms ── */}
          {mode !== 'reset_sent' && (
            <>
              {/* Title */}
              <h1 style={{fontSize:18,fontWeight:700,color:T.txt,marginBottom:4}}>
                {mode==='login' && 'Entrar na sua conta'}
                {mode==='signup' && 'Criar conta gratuita'}
                {mode==='reset' && 'Redefinir senha'}
              </h1>
              <p style={{fontSize:13,color:T.mute,marginBottom:24}}>
                {mode==='login' && 'Acesse o painel de performance'}
                {mode==='signup' && 'Comece a gerenciar seus clientes'}
                {mode==='reset' && 'Enviaremos um link para seu e-mail'}
              </p>

              {/* Alert */}
              {alert && <Alert msg={alert.msg} type={alert.type}/>}

              {/* Google (apenas login/signup) */}
              {mode !== 'reset' && (
                <>
                  <GoogleBtn onClick={handleGoogle} loading={loading}/>
                  <Divider/>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {mode === 'signup' && (
                  <Field
                    label="Nome completo"
                    value={name}
                    onChange={setName}
                    placeholder="Seu nome"
                    error={errors.name}
                    icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                  />
                )}

                <Field
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="seu@email.com"
                  error={errors.email}
                  icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                />

                {mode !== 'reset' && (
                  <>
                    <Field
                      label="Senha"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Mínimo 8 caracteres"
                      error={errors.password}
                      hint={mode==='signup'?undefined:undefined}
                      icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                    />
                    {mode === 'signup' && <StrengthBar pwd={password}/>}
                  </>
                )}

                {mode === 'signup' && (
                  <Field
                    label="Confirmar senha"
                    type="password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Repita a senha"
                    error={errors.confirm}
                    icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  />
                )}

                {/* Esqueci senha */}
                {mode === 'login' && (
                  <div style={{textAlign:'right',marginBottom:20,marginTop:-8}}>
                    <span className="link" onClick={()=>switchMode('reset')} style={{fontSize:12}}>
                      Esqueceu a senha?
                    </span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width:'100%', padding:'13px', borderRadius:10,
                    border:'none', background:T.accent, color:'#fff',
                    fontSize:14, fontWeight:600, fontFamily:T.font,
                    cursor:'pointer', display:'flex', alignItems:'center',
                    justifyContent:'center', gap:8, marginTop:4,
                  }}
                >
                  {loading && (
                    <div style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                  )}
                  {!loading && (
                    mode==='login' ? 'Entrar' :
                    mode==='signup' ? 'Criar conta' :
                    'Enviar link de redefinição'
                  )}
                  {loading && 'Aguarde...'}
                </button>
              </form>

              {/* Switch */}
              <p style={{textAlign:'center',marginTop:22,fontSize:13,color:T.mute}}>
                {mode==='login' && (<>Não tem conta? <span className="link" onClick={()=>switchMode('signup')}>Criar conta gratuita</span></>)}
                {mode==='signup' && (<>Já tem conta? <span className="link" onClick={()=>switchMode('login')}>Fazer login</span></>)}
                {mode==='reset' && (<><span className="link" onClick={()=>switchMode('login')}>← Voltar para login</span></>)}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{textAlign:'center',fontSize:11,color:T.mute,marginTop:24,lineHeight:1.6}}>
          Ao continuar, você concorda com os{' '}
          <span className="link" style={{fontSize:11}}>Termos de Uso</span>{' '}e{' '}
          <span className="link" style={{fontSize:11}}>Política de Privacidade</span>.
        </p>
      </div>
    </div>
  )
}
