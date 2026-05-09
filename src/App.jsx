import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Heart, X, Star, MessageCircle, User, Briefcase,
  Send, ChevronLeft, ChevronRight, Flame, Zap,
  Edit2, Camera, Check, RotateCcw, Shield,
  Eye, EyeOff, Loader, LogOut, Bell, AlertCircle,
} from 'lucide-react';

/* ─── Supabase client ─────────────────────────────────────────── */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ─── Theme ───────────────────────────────────────────────────── */
const T = {
  bg:'#0B0712', surface:'#130E1E', card:'#1C1530', cardHover:'#241B3C',
  primary:'#FF4D7D', secondary:'#FF8C5A', like:'#2ECF6D',
  nope:'#FF3B55', superlike:'#4DAAFF', accent:'#FFD166',
  text:'#F0EAFF', muted:'#8A78AA', faint:'#4A3D65',
  border:'#231840', borderMed:'#362558',
};
const pGrad  = `linear-gradient(135deg,${T.primary},${T.secondary})`;
const pGrad2 = `linear-gradient(135deg,${T.primary}33,${T.secondary}22)`;

/* ─── Helpers ─────────────────────────────────────────────────── */
const timeAgo = (ts) => {
  if (!ts) return '';
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
};

/* ─── Shared UI components ────────────────────────────────────── */
const Btn = ({ children, onClick, variant='primary', style={}, disabled=false, loading=false }) => {
  const v = {
    primary:   { background:pGrad,            color:'white' },
    secondary: { background:T.card,           color:T.text,  border:`1px solid ${T.border}` },
    ghost:     { background:'transparent',    color:T.muted },
    danger:    { background:`${T.nope}22`,    color:T.nope,  border:`1px solid ${T.nope}44` },
  };
  return (
    <button
      onClick={!disabled && !loading ? onClick : undefined}
      style={{ border:'none', borderRadius:14, padding:'14px 24px', fontSize:16, fontWeight:700,
        cursor: disabled||loading ? 'not-allowed' : 'pointer', opacity: disabled||loading ? 0.5 : 1,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        fontFamily:'inherit', transition:'opacity .15s, transform .1s', ...v[variant], ...style }}
      onMouseDown={e=>{ if (!disabled&&!loading) e.currentTarget.style.transform='scale(0.97)'; }}
      onMouseUp={e=>{ e.currentTarget.style.transform='scale(1)'; }}>
      {loading
        ? <><Loader size={16} style={{animation:'spin 1s linear infinite'}}/> Please wait...</>
        : children}
    </button>
  );
};

const Field = ({ label, error, children, style={} }) => (
  <div style={{marginBottom:16, ...style}}>
    {label && <div style={{color:T.muted, fontSize:13, fontWeight:600, marginBottom:6}}>{label}</div>}
    {children}
    {error && <div style={{color:T.nope, fontSize:12, marginTop:4}}>{error}</div>}
  </div>
);

const TextInput = ({ style={}, ...props }) => (
  <input style={{
    width:'100%', background:T.card, border:`1px solid ${T.border}`, borderRadius:14,
    padding:'13px 16px', color:T.text, fontSize:16, outline:'none',
    fontFamily:'inherit', boxSizing:'border-box', display:'block', ...style,
  }} {...props}/>
);

const CircleBtn = ({ icon, onClick, size=56, bg='transparent', border=true }) => (
  <button onClick={onClick} style={{
    width:size, height:size, borderRadius:'50%', background:bg,
    border: border ? `1.5px solid ${T.border}` : 'none',
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', flexShrink:0, transition:'transform .12s',
  }}
  onMouseDown={e=>e.currentTarget.style.transform='scale(0.88)'}
  onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
    {icon}
  </button>
);

const Avatar = ({ src, name='?', size=48, online=false }) => (
  <div style={{
    position:'relative', flexShrink:0, width:size, height:size, borderRadius:'50%',
    background:pGrad, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
  }}>
    {src
      ? <img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
          onError={e=>{e.target.style.display='none';}}/>
      : <span style={{color:'white',fontWeight:800,fontSize:size*0.38,fontFamily:'Georgia,serif'}}>{name[0]?.toUpperCase()}</span>
    }
    {online && <div style={{position:'absolute',bottom:1,right:1,width:size*0.22,height:size*0.22,
      borderRadius:'50%',background:T.like,border:`2px solid ${T.bg}`}}/>}
  </div>
);

const Spinner = () => (
  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{width:46,height:46,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.primary,animation:'spin 0.8s linear infinite'}}/>
  </div>
);

const ErrorBanner = ({ msg }) => msg ? (
  <div style={{background:`${T.nope}18`,border:`1px solid ${T.nope}44`,borderRadius:12,padding:'11px 14px',
    marginBottom:16,color:T.nope,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
    <AlertCircle size={16}/>{msg}
  </div>
) : null;

/* ─── AUTH SCREEN ─────────────────────────────────────────────── */
function AuthScreen() {
  const [mode, setMode]     = useState('login');
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);

  const submit = async () => {
    if (!email || !pw) { setError('Please fill in both fields.'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password:pw });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password:pw });
        if (error) throw error;
      }
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  };

  if (sent) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <div style={{maxWidth:380}}>
        <div style={{fontSize:64,marginBottom:16}}>📧</div>
        <h2 style={{color:T.text,fontFamily:'Georgia,serif',fontSize:26,fontWeight:900,margin:'0 0 12px'}}>Check your inbox</h2>
        <p style={{color:T.muted,lineHeight:1.7,marginBottom:24}}>
          We sent a confirmation link to <strong style={{color:T.text}}>{email}</strong>.<br/>
          Click it to activate your account, then come back and sign in.
        </p>
        <Btn variant='secondary' onClick={()=>{setSent(false);setMode('login');}}>← Back to Sign In</Btn>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',padding:'2rem',position:'relative',overflow:'hidden'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:'absolute',top:'-8%',right:'-12%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,77,125,0.16),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-5%',left:'-10%',width:340,height:340,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,140,90,0.12),transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:400,zIndex:1}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:'2.5rem'}}>
          <div style={{width:52,height:52,borderRadius:16,background:pGrad,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(255,77,125,0.35)'}}>
            <Flame size={28} color='white' fill='white'/>
          </div>
          <span style={{fontSize:32,fontWeight:900,background:pGrad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontFamily:'Georgia,serif'}}>Spark</span>
        </div>

        <h2 style={{color:T.text,fontFamily:'Georgia,serif',fontSize:28,fontWeight:900,margin:'0 0 6px',textAlign:'center'}}>
          {mode==='login' ? 'Welcome back' : 'Join Spark'}
        </h2>
        <p style={{color:T.muted,textAlign:'center',margin:'0 0 28px',fontSize:15}}>
          {mode==='login' ? 'Sign in to continue' : 'All features, completely free'}
        </p>

        <ErrorBanner msg={error}/>

        <Field label='Email address'>
          <TextInput type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder='you@example.com'
            onKeyDown={e=>e.key==='Enter'&&submit()}/>
        </Field>

        <Field label='Password' style={{marginBottom:24}}>
          <div style={{position:'relative'}}>
            <TextInput type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)}
              placeholder={mode==='signup'?'At least 6 characters':'Your password'}
              style={{paddingRight:48}} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button onClick={()=>setShowPw(s=>!s)}
              style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:T.muted,display:'flex',padding:0}}>
              {showPw?<EyeOff size={18}/>:<Eye size={18}/>}
            </button>
          </div>
        </Field>

        <Btn onClick={submit} loading={loading} style={{width:'100%',marginBottom:16}}>
          {mode==='login' ? <><Flame size={18}/> Sign In</> : <><Check size={18}/> Create Free Account</>}
        </Btn>

        <p style={{textAlign:'center',color:T.muted,fontSize:14,margin:0}}>
          {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={()=>{setMode(m=>m==='login'?'signup':'login');setError('');}}
            style={{background:'none',border:'none',cursor:'pointer',color:T.primary,fontWeight:700,fontSize:14,fontFamily:'inherit',padding:0}}>
            {mode==='login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── ONBOARD SCREEN ──────────────────────────────────────────── */
function OnboardScreen({ user, onDone }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ name:'', age:'', gender:'', seeking:'', bio:'', interests:[], avatarUrl:'' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const INTERESTS = [
    'Hiking','Coffee','Travel','Music','Cooking','Art','Gaming','Reading',
    'Yoga','Fitness','Photography','Dancing','Movies','Wine','Pets',
    'Concerts','Surfing','Tennis','Cycling','Food',
  ];

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 5*1024*1024) { setError('Photo must be under 5 MB'); return; }
    setUploading(true); setError('');
    try {
      const ext  = file.name.split('.').pop().toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error:upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert:true, contentType:file.type });
      if (upErr) throw upErr;
      const { data:{ publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setD(x=>({...x, avatarUrl:publicUrl}));
    } catch(e) { setError('Upload failed: ' + e.message); }
    finally    { setUploading(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, name:d.name.trim(), age:parseInt(d.age),
        gender:d.gender, seeking:d.seeking, bio:d.bio.trim(),
        interests:d.interests, avatar_url:d.avatarUrl,
        onboarding_complete:true, updated_at:new Date().toISOString(),
      });
      if (error) throw error;
      onDone();
    } catch(e) { setError(e.message); setSaving(false); }
  };

  const Choice = ({ label, field, value, emoji }) => {
    const sel = d[field] === value;
    return (
      <div onClick={()=>setD(x=>({...x,[field]:value}))} style={{
        padding:'15px 20px', borderRadius:14, marginBottom:10, cursor:'pointer',
        background:sel?pGrad2:T.card, border:`1.5px solid ${sel?T.primary:T.border}`,
        color:sel?T.text:T.muted, fontSize:17, fontWeight:sel?700:400, transition:'all .2s',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span>{emoji&&<span style={{marginRight:10}}>{emoji}</span>}{label}</span>
        {sel&&<Check size={18} color={T.primary}/>}
      </div>
    );
  };

  const steps = [
    {
      title:"What's your name?", subtitle:"How you'll appear to others.",
      valid: d.name.trim().length > 1 && parseInt(d.age) >= 18,
      body: (
        <>
          <Field label='First name'><TextInput value={d.name} onChange={e=>setD(x=>({...x,name:e.target.value}))} placeholder='Your first name'/></Field>
          <Field label='Age'><TextInput type='number' min='18' max='99' value={d.age} onChange={e=>setD(x=>({...x,age:e.target.value}))} placeholder='Your age'/></Field>
        </>
      ),
    },
    {
      title:'Add a photo', subtitle:'Profiles with photos get 8× more matches.',
      valid: true,
      body: (
        <div style={{textAlign:'center'}}>
          <div style={{width:160,height:160,borderRadius:'50%',margin:'0 auto 24px',overflow:'hidden',
            background:d.avatarUrl?'transparent':pGrad2, border:`2px dashed ${T.borderMed}`,
            display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            {d.avatarUrl
              ? <img src={d.avatarUrl} alt='preview' style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <div style={{textAlign:'center'}}><Camera size={40} color={T.faint}/><div style={{color:T.faint,fontSize:13,marginTop:8}}>No photo yet</div></div>
            }
            {uploading&&(
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Loader size={28} color='white' style={{animation:'spin 1s linear infinite'}}/>
              </div>
            )}
          </div>
          <label style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:14,
            background:T.card,border:`1px solid ${T.border}`,color:T.text,cursor:'pointer',fontSize:15,fontWeight:600}}>
            <Camera size={16}/>{d.avatarUrl?'Change Photo':'Upload Photo'}
            <input type='file' accept='image/*' style={{display:'none'}} onChange={e=>uploadPhoto(e.target.files[0])}/>
          </label>
          <p style={{color:T.faint,fontSize:13,marginTop:12}}>JPG or PNG · Max 5 MB · Optional</p>
        </div>
      ),
    },
    {
      title:'I identify as...', subtitle:'Helps us find the right matches.',
      valid: d.gender !== '',
      body: (
        <>
          <Choice label='Woman'      field='gender' value='Woman'      emoji='👩'/>
          <Choice label='Man'        field='gender' value='Man'        emoji='👨'/>
          <Choice label='Non-binary' field='gender' value='Non-binary' emoji='🧑'/>
          <Choice label='Other'      field='gender' value='Other'      emoji='✨'/>
        </>
      ),
    },
    {
      title:"I'm looking for...", subtitle:'Who would you like to connect with?',
      valid: d.seeking !== '',
      body: (
        <>
          <Choice label='Women'    field='seeking' value='Women'    emoji='👩'/>
          <Choice label='Men'      field='seeking' value='Men'      emoji='👨'/>
          <Choice label='Everyone' field='seeking' value='Everyone' emoji='💫'/>
        </>
      ),
    },
    {
      title:'Your interests', subtitle:'Pick up to 5 things you love.',
      valid: d.interests.length > 0,
      body: (
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {INTERESTS.map(i=>{
            const sel = d.interests.includes(i);
            return (
              <div key={i} onClick={()=>setD(x=>({...x,interests:sel?x.interests.filter(v=>v!==i):[...x.interests,i].slice(0,5)}))}
                style={{padding:'9px 18px',borderRadius:99,cursor:'pointer',fontSize:14,
                  background:sel?pGrad:T.card, color:sel?'white':T.muted,
                  border:`1px solid ${sel?'transparent':T.border}`, fontWeight:sel?700:400, transition:'all .2s'}}>
                {i}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title:'About you', subtitle:'Write a short bio. Authentic beats perfect.',
      valid: d.bio.trim().length > 10,
      body: (
        <>
          <textarea value={d.bio} onChange={e=>setD(x=>({...x,bio:e.target.value}))} maxLength={300}
            placeholder='What makes you, you? What are you looking for?'
            style={{width:'100%',background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
              padding:'14px 16px',color:T.text,fontSize:15,outline:'none',fontFamily:'inherit',
              height:150,resize:'none',lineHeight:1.7,boxSizing:'border-box',display:'block'}}/>
          <div style={{textAlign:'right',color:T.faint,fontSize:12,marginTop:6}}>{d.bio.length}/300</div>
        </>
      ),
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      padding:'2rem',maxWidth:480,margin:'0 auto',boxSizing:'border-box'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {/* Progress */}
      <div style={{display:'flex',gap:6,marginTop:'0.5rem',marginBottom:'2rem'}}>
        {steps.map((_,i)=>(
          <div key={i} style={{flex:1,height:4,borderRadius:99,background:i<=step?pGrad:T.card,transition:'background .3s'}}/>
        ))}
      </div>

      <h2 style={{fontSize:28,fontWeight:900,color:T.text,margin:'0 0 6px',fontFamily:'Georgia,serif'}}>{cur.title}</h2>
      <p style={{color:T.muted,margin:'0 0 24px',fontSize:15}}>{cur.subtitle}</p>

      <ErrorBanner msg={error}/>

      <div style={{flex:1}}>{cur.body}</div>

      <div style={{display:'flex',gap:12,paddingTop:'1.5rem'}}>
        {step > 0 && <Btn variant='secondary' onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← Back</Btn>}
        <Btn
          disabled={!cur.valid && step !== 1}
          loading={isLast && saving}
          onClick={()=>{ if (!cur.valid && step!==1) return; isLast ? saveProfile() : setStep(s=>s+1); }}
          style={{flex:2}}>
          {isLast ? '🔥 Find My Matches' : 'Continue →'}
        </Btn>
      </div>
    </div>
  );
}

/* ─── SWIPE CARD ──────────────────────────────────────────────── */
function SwipeCard({ profile, onLike, onDislike, isTop, stackIndex }) {
  const [drag, setDrag]         = useState({x:0,y:0,active:false});
  const [expanded, setExpanded] = useState(false);
  const origin = useRef(null);

  const startDrag = useCallback((cx,cy)=>{
    if (!isTop) return;
    origin.current={cx,cy};
    setDrag(d=>({...d,active:true}));
  },[isTop]);

  const moveDrag = useCallback((cx,cy)=>{
    if (!drag.active||!origin.current) return;
    setDrag(d=>({...d,x:cx-origin.current.cx,y:cy-origin.current.cy}));
  },[drag.active]);

  const endDrag = useCallback(()=>{
    if (!drag.active) return;
    const x = drag.x;
    setDrag({x:0,y:0,active:false});
    origin.current=null;
    if (x > 100) onLike();
    else if (x < -100) onDislike();
  },[drag.active,drag.x,onLike,onDislike]);

  const rot   = isTop ? drag.x*0.07 : 0;
  const likeO = isTop ? Math.min(1, drag.x/80)  : 0;
  const nopeO = isTop ? Math.min(1,-drag.x/80)  : 0;

  return (
    <div
      onMouseDown={e=>startDrag(e.clientX,e.clientY)}
      onMouseMove={e=>moveDrag(e.clientX,e.clientY)}
      onMouseUp={endDrag} onMouseLeave={endDrag}
      onTouchStart={e=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
      onTouchMove={e=>{e.preventDefault();moveDrag(e.touches[0].clientX,e.touches[0].clientY);}}
      onTouchEnd={endDrag}
      style={{
        position:'absolute', inset:0,
        transform: isTop
          ? `translate(${drag.x}px,${drag.y*0.3}px) rotate(${rot}deg)`
          : `translateY(${stackIndex*7}px) scale(${1-stackIndex*0.04})`,
        transition: drag.active ? 'none' : 'transform 0.32s cubic-bezier(.34,1.56,.64,1)',
        cursor: isTop ? (drag.active?'grabbing':'grab') : 'default',
        userSelect:'none', touchAction:'none', zIndex:10-stackIndex,
      }}>
      <div style={{width:'100%',height:'100%',borderRadius:26,overflow:'hidden',background:T.card,position:'relative',boxShadow:'0 24px 64px rgba(0,0,0,0.55)'}}>
        {/* Photo or initial fallback */}
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt={profile.name} draggable={false}
              style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',top:0,left:0}}/>
          : <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#2D1F45,#1A1028)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:120,fontWeight:900,color:'rgba(255,255,255,0.1)',fontFamily:'Georgia,serif'}}>{profile.name?.[0]}</span>
            </div>
        }

        {/* Gradient overlay */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.15) 55%,transparent 100%)'}}/>

        {/* LIKE / NOPE stamps */}
        <div style={{position:'absolute',top:32,left:20,padding:'7px 18px',borderRadius:10,border:'4px solid #2ECF6D',
          color:'#2ECF6D',fontSize:30,fontWeight:900,opacity:likeO,transform:'rotate(-18deg)',letterSpacing:3,pointerEvents:'none'}}>LIKE</div>
        <div style={{position:'absolute',top:32,right:20,padding:'7px 18px',borderRadius:10,border:'4px solid #FF3B55',
          color:'#FF3B55',fontSize:30,fontWeight:900,opacity:nopeO,transform:'rotate(18deg)',letterSpacing:3,pointerEvents:'none'}}>NOPE</div>

        {/* Info panel */}
        {isTop && (
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'0 22px 22px'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:6}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:28,fontWeight:900,color:'white',fontFamily:'Georgia,serif'}}>{profile.name}</span>
                  <span style={{fontSize:22,color:'rgba(255,255,255,0.75)'}}>{profile.age}</span>
                </div>
                {profile.job && (
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.65)',display:'flex',alignItems:'center',gap:4}}>
                    <Briefcase size={12}/>{profile.job}
                  </span>
                )}
              </div>
              <div onClick={e=>{e.stopPropagation();setExpanded(x=>!x)}}
                style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.12)',
                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                <ChevronRight size={18} color='white' style={{transform:expanded?'rotate(90deg)':'rotate(-90deg)',transition:'transform .2s'}}/>
              </div>
            </div>

            <p onClick={e=>{e.stopPropagation();setExpanded(x=>!x)}}
              style={{fontSize:14,color:'rgba(255,255,255,0.8)',margin:'0 0 10px',lineHeight:1.55,cursor:'pointer',
                display:expanded?'block':'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
              {profile.bio||'No bio yet.'}
            </p>

            {expanded && profile.interests?.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                {profile.interests.map(i=>(
                  <span key={i} style={{padding:'4px 12px',borderRadius:99,background:'rgba(255,255,255,0.12)',
                    color:'white',fontSize:12,border:'1px solid rgba(255,255,255,0.2)'}}>{i}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SWIPE SCREEN ────────────────────────────────────────────── */
function SwipeScreen({ user, myProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [idx, setIdx]           = useState(0);
  const [loading, setLoading]   = useState(true);
  const [matchNotif, setMatchNotif] = useState(null);
  const [toast, setToast]       = useState(null);

  useEffect(()=>{ loadProfiles(); },[]);

  const loadProfiles = async () => {
    setLoading(true);
    const { data:swiped } = await supabase.from('swipes').select('swiped_id').eq('swiper_id', user.id);
    const exclude = [user.id, ...(swiped?.map(s=>s.swiped_id)||[])];

    let query = supabase.from('profiles').select('*').eq('onboarding_complete',true).neq('id',user.id);
    if (swiped?.length > 0) {
      query = query.not('id','in',`(${swiped.map(s=>s.swiped_id).join(',')})`);
    }
    const { data } = await query.limit(40);
    setProfiles((data||[]).filter(p=>!exclude.includes(p.id)));
    setIdx(0);
    setLoading(false);
  };

  const showToast = (msg,color) => {
    setToast({msg,color});
    setTimeout(()=>setToast(null),1400);
  };

  const handleSwipe = useCallback(async (direction)=>{
    const target = profiles[idx];
    if (!target) return;
    setIdx(i=>i+1);

    if (direction==='like')      showToast('❤️  Liked!',     T.like);
    else if (direction==='dislike') showToast('✕  Nope',     T.nope);
    else                            showToast('⭐ Super Like!', T.superlike);

    // Record swipe
    await supabase.from('swipes').insert({ swiper_id:user.id, swiped_id:target.id, direction });

    // Check for mutual like → create match
    if (direction==='like'||direction==='superlike') {
      const { data:theirSwipe } = await supabase.from('swipes')
        .select('id').eq('swiper_id',target.id).eq('swiped_id',user.id)
        .in('direction',['like','superlike']).maybeSingle();

      if (theirSwipe) {
        const { error } = await supabase.from('matches').insert({ user1_id:user.id, user2_id:target.id });
        if (!error) setMatchNotif(target);
      }
    }
  },[idx,profiles,user.id]);

  const like    = useCallback(()=>handleSwipe('like'),     [handleSwipe]);
  const dislike = useCallback(()=>handleSwipe('dislike'),  [handleSwipe]);
  const superLk = useCallback(()=>handleSwipe('superlike'),[handleSwipe]);

  const current = profiles[idx];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Flame size={24} color={T.primary} fill={T.primary}/>
          <span style={{fontSize:22,fontWeight:900,background:pGrad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontFamily:'Georgia,serif'}}>Spark</span>
        </div>
        <CircleBtn icon={<Bell size={18} color={T.muted}/>} onClick={()=>{}} size={38}/>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',background:toast.color,
          color:'white',padding:'10px 26px',borderRadius:99,fontWeight:700,fontSize:16,
          zIndex:999,boxShadow:'0 4px 24px rgba(0,0,0,0.4)',whiteSpace:'nowrap',pointerEvents:'none'}}>
          {toast.msg}
        </div>
      )}

      {/* Match modal */}
      {matchNotif && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:'2rem',textAlign:'center'}}>
          <div style={{fontSize:14,color:T.primary,fontWeight:700,textTransform:'uppercase',letterSpacing:2,marginBottom:12}}>It's a Match!</div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <Avatar src={myProfile?.avatar_url} name={user.email} size={88}/>
            <span style={{fontSize:36}}>❤️</span>
            <Avatar src={matchNotif.avatar_url} name={matchNotif.name} size={88}/>
          </div>
          <h2 style={{color:T.text,fontFamily:'Georgia,serif',fontSize:26,fontWeight:900,margin:'0 0 8px'}}>
            You & {matchNotif.name} liked each other!
          </h2>
          <p style={{color:T.muted,marginBottom:28,lineHeight:1.6}}>Don't be shy — send the first message!</p>
          <Btn onClick={()=>setMatchNotif(null)} style={{width:'100%',maxWidth:280}}>Send a Message 💬</Btn>
          <button onClick={()=>setMatchNotif(null)} style={{background:'none',border:'none',color:T.muted,cursor:'pointer',marginTop:16,fontFamily:'inherit',fontSize:14}}>Keep Swiping</button>
        </div>
      )}

      {loading ? <Spinner/> : !current ? (
        /* Empty state */
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
          <div style={{fontSize:64,marginBottom:16}}>🌟</div>
          <h2 style={{color:T.text,fontSize:24,fontWeight:900,fontFamily:'Georgia,serif',margin:'0 0 8px'}}>You've seen everyone!</h2>
          <p style={{color:T.muted,marginBottom:28,fontSize:16,lineHeight:1.6}}>New people join every day. Check back soon!</p>
          <Btn onClick={loadProfiles} style={{gap:8}}><RotateCcw size={18}/> Refresh</Btn>
        </div>
      ) : (
        <>
          {/* Card stack */}
          <div style={{flex:1,position:'relative',padding:'0 16px',minHeight:0}}>
            <div style={{position:'absolute',inset:'0 16px 0 16px',maxWidth:420,margin:'0 auto'}}>
              {[idx+2,idx+1,idx].map((i,pos)=>{
                if (i>=profiles.length) return null;
                const isTop = i===idx;
                return (
                  <div key={profiles[i].id} style={{position:'absolute',inset:0,pointerEvents:isTop?'auto':'none'}}>
                    <SwipeCard profile={profiles[i]} isTop={isTop} stackIndex={2-pos}
                      onLike={like} onDislike={dislike}/>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>

          {/* Counter */}
          <div style={{textAlign:'center',fontSize:13,color:T.faint,margin:'4px 0',flexShrink:0}}>
            {idx+1} of {profiles.length}
          </div>

          {/* Buttons */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,padding:'12px 20px 20px',flexShrink:0}}>
            <CircleBtn size={46} icon={<RotateCcw size={18} color={T.accent}/>} onClick={()=>setIdx(i=>Math.max(0,i-1))}/>
            <CircleBtn size={66} icon={<X size={30} color={T.nope}/>}  bg={`${T.nope}18`}      onClick={dislike}/>
            <CircleBtn size={46} icon={<Star size={20} color={T.superlike}/>} bg={`${T.superlike}18`} onClick={superLk}/>
            <CircleBtn size={66} icon={<Heart size={30} color={T.like} fill={T.like}/>} bg={`${T.like}18`} onClick={like}/>
            <CircleBtn size={46} icon={<Zap size={20} color={T.primary}/>} bg={pGrad2}  onClick={()=>{}}/>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── MATCHES SCREEN ──────────────────────────────────────────── */
function MatchesScreen({ user, onChat }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ loadMatches(); },[]);

  const loadMatches = async () => {
    setLoading(true);

    // 1. Get match records
    const { data:matchRows } = await supabase.from('matches')
      .select('id,user1_id,user2_id,created_at')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at',{ascending:false});

    if (!matchRows?.length) { setLoading(false); return; }

    // 2. Fetch the other users' profiles
    const otherIds = matchRows.map(m=>m.user1_id===user.id?m.user2_id:m.user1_id);
    const { data:profileRows } = await supabase.from('profiles')
      .select('id,name,avatar_url').in('id',otherIds);

    const profileMap = Object.fromEntries((profileRows||[]).map(p=>[p.id,p]));

    // 3. Fetch the most recent message per match
    const matchIds = matchRows.map(m=>m.id);
    const { data:msgRows } = await supabase.from('messages')
      .select('match_id,content,sender_id,created_at')
      .in('match_id',matchIds).order('created_at',{ascending:false});

    const lastMsg = {};
    (msgRows||[]).forEach(m=>{ if (!lastMsg[m.match_id]) lastMsg[m.match_id]=m; });

    // 4. Count unread per match
    const { data:unreadRows } = await supabase.from('messages')
      .select('match_id').in('match_id',matchIds)
      .eq('read',false).neq('sender_id',user.id);

    const unreadCount = {};
    (unreadRows||[]).forEach(m=>{ unreadCount[m.match_id]=(unreadCount[m.match_id]||0)+1; });

    // 5. Assemble
    const result = matchRows.map(m=>{
      const otherId = m.user1_id===user.id?m.user2_id:m.user1_id;
      const other   = profileMap[otherId]||{};
      const lm      = lastMsg[m.id];
      return {
        matchId:   m.id,
        id:        other.id,
        name:      other.name||'Unknown',
        avatar_url: other.avatar_url,
        lastMsg:   lm?.content||'Say hello! 👋',
        time:      lm ? timeAgo(lm.created_at) : timeAgo(m.created_at),
        unread:    unreadCount[m.id]||0,
      };
    });

    setMatches(result);
    setLoading(false);
  };

  if (loading) return <Spinner/>;

  if (!matches.length) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <div style={{fontSize:64,marginBottom:16}}>💫</div>
      <h2 style={{color:T.text,fontFamily:'Georgia,serif',fontSize:24,fontWeight:900,margin:'0 0 8px'}}>No matches yet</h2>
      <p style={{color:T.muted,fontSize:16,lineHeight:1.6}}>Keep swiping — your matches will appear here.</p>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
      <h2 style={{color:T.text,fontFamily:'Georgia,serif',fontWeight:900,fontSize:22,margin:'0 0 22px',padding:'0 4px'}}>Matches & Messages</h2>

      {/* New matches carousel */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:12,color:T.muted,fontWeight:700,marginBottom:14,textTransform:'uppercase',letterSpacing:1.5,padding:'0 4px'}}>New Matches</div>
        <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none'}}>
          {matches.map(m=>(
            <div key={m.matchId} onClick={()=>onChat(m)} style={{textAlign:'center',cursor:'pointer',flexShrink:0}}>
              <div style={{width:76,height:76,borderRadius:'50%',padding:3,background:pGrad,marginBottom:6}}>
                <Avatar src={m.avatar_url} name={m.name} size={70}/>
              </div>
              <div style={{fontSize:13,color:T.text,fontWeight:600}}>{m.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div>
        <div style={{fontSize:12,color:T.muted,fontWeight:700,marginBottom:14,textTransform:'uppercase',letterSpacing:1.5,padding:'0 4px'}}>Messages</div>
        {matches.map(m=>(
          <div key={m.matchId} onClick={()=>onChat(m)}
            style={{display:'flex',alignItems:'center',gap:14,padding:'12px 10px',borderRadius:18,marginBottom:2,cursor:'pointer',transition:'background .18s'}}
            onMouseEnter={e=>e.currentTarget.style.background=T.card}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <Avatar src={m.avatar_url} name={m.name} size={58} online={m.unread>0}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                <span style={{fontWeight:700,color:T.text,fontSize:16}}>{m.name}</span>
                <span style={{fontSize:12,color:T.faint}}>{m.time}</span>
              </div>
              <p style={{margin:0,fontSize:14,color:m.unread?T.text:T.muted,
                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontWeight:m.unread?600:400}}>
                {m.lastMsg}
              </p>
            </div>
            {m.unread>0&&(
              <div style={{width:22,height:22,borderRadius:'50%',background:pGrad,color:'white',
                fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{m.unread}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CHAT SCREEN ─────────────────────────────────────────────── */
function ChatScreen({ user, match, onBack }) {
  const [msgs, setMsgs]   = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(()=>{
    loadMsgs();

    // Mark messages read
    supabase.from('messages').update({read:true})
      .eq('match_id',match.matchId).neq('sender_id',user.id).then(()=>{});

    // Real-time subscription
    const channel = supabase.channel(`chat-${match.matchId}`)
      .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'messages',filter:`match_id=eq.${match.matchId}`},
        payload=>setMsgs(prev=>[...prev,payload.new]))
      .subscribe();

    return ()=>{ supabase.removeChannel(channel); };
  },[match.matchId]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);

  const loadMsgs = async () => {
    const { data } = await supabase.from('messages')
      .select('*').eq('match_id',match.matchId).order('created_at');
    setMsgs(data||[]);
    setLoading(false);
  };

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    await supabase.from('messages').insert({ match_id:match.matchId, sender_id:user.id, content });
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:`1px solid ${T.border}`,background:T.surface,flexShrink:0}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,padding:4,display:'flex',alignItems:'center'}}>
          <ChevronLeft size={26}/>
        </button>
        <Avatar src={match.avatar_url} name={match.name} size={44} online/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:T.text,fontSize:16}}>{match.name}</div>
          <div style={{fontSize:12,color:T.like}}>● Active now</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
        {loading ? <Spinner/> : (
          <>
            <div style={{textAlign:'center',marginBottom:8}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 20px',borderRadius:99,background:pGrad2,border:`1px solid ${T.borderMed}`}}>
                <Heart size={14} color={T.primary} fill={T.primary}/>
                <span style={{fontSize:13,color:T.primary,fontWeight:600}}>You matched with {match.name}!</span>
              </div>
            </div>

            {msgs.map((msg,i)=>(
              <div key={msg.id||i} style={{display:'flex',justifyContent:msg.sender_id===user.id?'flex-end':'flex-start',alignItems:'flex-end',gap:8}}>
                {msg.sender_id!==user.id&&<Avatar src={match.avatar_url} name={match.name} size={28}/>}
                <div style={{maxWidth:'70%'}}>
                  <div style={{padding:'11px 16px',borderRadius:20,fontSize:15,lineHeight:1.5,color:T.text,
                    background:msg.sender_id===user.id?pGrad:T.card,
                    borderBottomRightRadius:msg.sender_id===user.id?4:20,
                    borderBottomLeftRadius:msg.sender_id!==user.id?4:20}}>
                    {msg.content}
                  </div>
                  <div style={{fontSize:11,color:T.faint,textAlign:msg.sender_id===user.id?'right':'left',marginTop:3,paddingInline:4}}>
                    {timeAgo(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {!msgs.length&&<div style={{textAlign:'center',color:T.muted,marginTop:20,fontSize:15}}>No messages yet. Say hello! 👋</div>}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* Quick replies */}
      <div style={{display:'flex',gap:8,padding:'8px 16px 0',overflowX:'auto',scrollbarWidth:'none',flexShrink:0}}>
        {["👋 Hey!","So tell me more...","Let's meet for coffee ☕","You seem really cool 😊"].map(r=>(
          <button key={r} onClick={()=>setInput(r)}
            style={{padding:'7px 14px',borderRadius:99,background:T.card,border:`1px solid ${T.border}`,
              color:T.muted,fontSize:13,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',flexShrink:0}}>
            {r}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{display:'flex',gap:10,padding:'10px 16px 16px',flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder={`Message ${match.name}...`}
          style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:26,
            padding:'12px 18px',color:T.text,fontSize:15,outline:'none',fontFamily:'inherit'}}/>
        <button onClick={send} style={{width:48,height:48,borderRadius:'50%',
          background:input.trim()?pGrad:T.card,border:`1px solid ${T.border}`,
          cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .2s'}}>
          <Send size={18} color='white'/>
        </button>
      </div>
    </div>
  );
}

/* ─── PROFILE SCREEN ──────────────────────────────────────────── */
function ProfileScreen({ user, profile, setProfile, onSignOut }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({name:profile?.name||'', bio:profile?.bio||''});
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data } = await supabase.from('profiles')
      .update({name:form.name.trim(), bio:form.bio.trim(), updated_at:new Date().toISOString()})
      .eq('id',user.id).select().single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  };

  const changePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert:true, contentType:file.type });
    const { data:{ publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { data } = await supabase.from('profiles').update({avatar_url:publicUrl}).eq('id',user.id).select().single();
    if (data) setProfile(data);
    setUploading(false);
  };

  const Row = ({ icon, label, sub, danger=false, onClick }) => (
    <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:14,padding:'15px 16px',
      background:T.card,borderRadius:16,marginBottom:8,cursor:'pointer',border:`1px solid ${T.border}`,transition:'background .18s'}}
      onMouseEnter={e=>e.currentTarget.style.background=T.cardHover}
      onMouseLeave={e=>e.currentTarget.style.background=T.card}>
      <div style={{width:40,height:40,borderRadius:12,background:danger?`${T.nope}22`:pGrad2,
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{color:danger?T.nope:T.text,fontWeight:600,fontSize:16}}>{label}</div>
        {sub&&<div style={{color:T.muted,fontSize:13,marginTop:1}}>{sub}</div>}
      </div>
      <ChevronRight size={16} color={T.faint}/>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:'auto'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{maxWidth:500,margin:'0 auto',padding:'16px'}}>

        {/* Photo card */}
        <div style={{borderRadius:24,background:T.card,overflow:'hidden',marginBottom:16,border:`1px solid ${T.border}`}}>
          <div style={{height:280,background:'linear-gradient(135deg,#2D1F45,#1A1028)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}}/>
              : <span style={{fontSize:90,fontWeight:900,color:'rgba(255,255,255,0.1)',fontFamily:'Georgia,serif'}}>{profile?.name?.[0]}</span>
            }
            {uploading&&(
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Loader size={32} color='white' style={{animation:'spin 1s linear infinite'}}/>
              </div>
            )}
            <label style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,0.12)',
              backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,
              padding:'8px 16px',color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:14,fontWeight:600}}>
              <Camera size={14}/> Edit Photo
              <input type='file' accept='image/*' style={{display:'none'}} onChange={e=>changePhoto(e.target.files[0])}/>
            </label>
          </div>
          <div style={{padding:'16px 20px 20px'}}>
            {editing
              ? <Field label='Name'><TextInput value={form.name} onChange={e=>setForm(x=>({...x,name:e.target.value}))}/></Field>
              : (
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <span style={{fontSize:24,fontWeight:900,color:T.text,fontFamily:'Georgia,serif'}}>{profile?.name}</span>
                  <span style={{fontSize:18,color:T.muted}}>{profile?.age}</span>
                </div>
              )
            }
          </div>
        </div>

        {/* About */}
        <div style={{background:T.card,borderRadius:20,padding:'18px 20px',marginBottom:12,border:`1px solid ${T.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,color:T.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5}}>About</div>
            {!editing
              ? <button onClick={()=>setEditing(true)} style={{background:'none',border:'none',cursor:'pointer',color:T.primary,display:'flex',gap:5,alignItems:'center',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
                  <Edit2 size={13}/> Edit
                </button>
              : <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setEditing(false);setForm({name:profile?.name||'',bio:profile?.bio||''});}}
                    style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:13,fontFamily:'inherit'}}>Cancel</button>
                  <Btn onClick={save} loading={saving} style={{padding:'6px 16px',fontSize:13}}>Save</Btn>
                </div>
            }
          </div>
          {editing
            ? <textarea value={form.bio} onChange={e=>setForm(x=>({...x,bio:e.target.value}))} maxLength={300}
                style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,
                  padding:'12px 14px',color:T.text,fontSize:15,outline:'none',fontFamily:'inherit',
                  height:120,resize:'none',lineHeight:1.7,boxSizing:'border-box'}}/>
            : <p style={{color:T.text,margin:0,lineHeight:1.7,fontSize:15}}>{profile?.bio||'Add a bio to tell your story...'}</p>
          }
        </div>

        {/* Interests */}
        {profile?.interests?.length > 0 && (
          <div style={{background:T.card,borderRadius:20,padding:'18px 20px',marginBottom:16,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,color:T.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,marginBottom:14}}>Interests</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {profile.interests.map(i=>(
                <span key={i} style={{padding:'7px 16px',borderRadius:99,background:pGrad2,color:T.text,fontSize:14,border:`1px solid ${T.borderMed}`}}>{i}</span>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:12,color:T.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,marginBottom:14,padding:'0 4px'}}>Settings</div>
          <Row icon='🔔' label='Notifications'  sub='Manage alerts'/>
          <Row icon='📍' label='Discovery'      sub={`Seeking: ${profile?.seeking||'Everyone'}`}/>
          <Row icon='🔒' label='Privacy'        sub='Manage your data'/>
          <Row icon='🌟' label='Spark Free'     sub='All features · always free'/>
          <Row icon='🚪' label='Sign Out' danger onClick={onSignOut}/>
        </div>

        <div style={{textAlign:'center',padding:'16px 0 8px'}}>
          <p style={{color:T.faint,fontSize:12,margin:0}}>Spark · Always Free · Made with ❤️</p>
        </div>
      </div>
    </div>
  );
}

/* ─── BOTTOM NAV ──────────────────────────────────────────────── */
function BottomNav({ active, onChange, newCount=0 }) {
  const tabs = [
    {id:'swipe',   icon:<Flame/>,        label:'Discover'},
    {id:'matches', icon:<Heart/>,         label:'Matches',  badge:newCount},
    {id:'chat',    icon:<MessageCircle/>, label:'Chats'},
    {id:'profile', icon:<User/>,          label:'Profile'},
  ];
  return (
    <div style={{display:'flex',background:T.surface,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
      {tabs.map(tab=>{
        const on = active===tab.id;
        return (
          <button key={tab.id} onClick={()=>onChange(tab.id)}
            style={{flex:1,padding:'10px 0 8px',border:'none',background:'none',cursor:'pointer',
              display:'flex',flexDirection:'column',alignItems:'center',gap:3,position:'relative'}}>
            <div style={{position:'relative'}}>
              <div style={{color:on?T.primary:T.faint,transition:'color .2s'}}>
                {React.cloneElement(tab.icon,{size:22,fill:on?T.primary:'none'})}
              </div>
              {tab.badge>0&&(
                <div style={{position:'absolute',top:-4,right:-6,width:16,height:16,borderRadius:'50%',
                  background:T.primary,color:'white',fontSize:10,fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${T.surface}`}}>{tab.badge}</div>
              )}
            </div>
            <span style={{fontSize:10,color:on?T.primary:T.faint,fontWeight:on?700:400}}>{tab.label}</span>
            {on&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:24,height:2,borderRadius:99,background:pGrad}}/>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── MAIN APP ────────────────────────────────────────────────── */
function MainApp({ session, profile, setProfile }) {
  const [tab, setTab]       = useState('swipe');
  const [chat, setChat]     = useState(null);
  const [newCount, setNew]  = useState(0);

  const signOut = () => supabase.auth.signOut();

  // Listen for new matches in real-time
  useEffect(()=>{
    const channel = supabase.channel('new-matches')
      .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'matches',filter:`user1_id=eq.${session.user.id}`},
        ()=>setNew(n=>n+1))
      .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'matches',filter:`user2_id=eq.${session.user.id}`},
        ()=>setNew(n=>n+1))
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[session.user.id]);

  const openChat = (m) => { setChat(m); setNew(n=>Math.max(0,n-(m.unread||0))); };

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:T.bg,
      fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",overflow:'hidden',maxWidth:520,margin:'0 auto'}}>
      {chat ? (
        <ChatScreen user={session.user} match={chat} onBack={()=>setChat(null)}/>
      ) : (
        <>
          {tab==='swipe'   && <SwipeScreen   user={session.user} myProfile={profile}/>}
          {tab==='matches' && <MatchesScreen user={session.user} onChat={openChat}/>}
          {tab==='chat'    && <MatchesScreen user={session.user} onChat={openChat}/>}
          {tab==='profile' && <ProfileScreen user={session.user} profile={profile} setProfile={setProfile} onSignOut={signOut}/>}
          <BottomNav active={tab} onChange={t=>{setTab(t);setNew(0);}} newCount={newCount}/>
        </>
      )}
    </div>
  );
}

/* ─── ROOT ────────────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
    setProfile(data);
  };

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data:{session}})=>{
      setSession(session);
      if (session) await loadProfile(session.user.id);
      setLoading(false);
    });

    const { data:{subscription} } = supabase.auth.onAuthStateChange(async (_event,session)=>{
      setSession(session);
      if (session) await loadProfile(session.user.id);
      else setProfile(null);
    });

    return ()=>subscription.unsubscribe();
  },[]);

  if (loading) return (
    <div style={{height:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:46,height:46,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.primary,animation:'spin 0.8s linear infinite'}}/>
      <div style={{fontSize:14,color:T.muted}}>Loading Spark...</div>
    </div>
  );

  if (!session)                     return <AuthScreen/>;
  if (!profile?.onboarding_complete) return <OnboardScreen user={session.user} onDone={()=>loadProfile(session.user.id)}/>;
  return <MainApp session={session} profile={profile} setProfile={setProfile}/>;
}
