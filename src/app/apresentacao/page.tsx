'use client'

import { useState, useEffect, useCallback } from 'react'

const SLIDES = [
  {
    id: 'abertura',
    num: '1 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',flex:1}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(23,195,201,.15)',border:'1px solid rgba(23,195,201,.35)',color:'#17C3C9',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',padding:'6px 14px',borderRadius:'20px',marginBottom:'24px',width:'fit-content',textTransform:'uppercase'}}>
          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#17C3C9',display:'inline-block'}} />
          Norma em vigor desde 26/05/2026
        </div>
        <h1 style={{fontSize:'50px',fontWeight:900,color:'#fff',lineHeight:1.05,marginBottom:'20px',letterSpacing:'-.02em'}}>
          Sua empresa tem<br /><span style={{color:'#17C3C9'}}>funcionário CLT?</span><br />Você precisa ver isso.
        </h1>
        <p style={{fontSize:'18px',color:'#7a9bb8',lineHeight:1.65,maxWidth:'600px'}}>
          A NR-1 passou a exigir o diagnóstico de riscos psicossociais de <strong style={{color:'#c0d8ef'}}>toda</strong> empresa com ao menos 1 funcionário CLT. Quem não cumprir responde com multa e processo trabalhista.
        </p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginTop:'30px'}}>
          {['⚠️  Multa de R$ 6.708 por item autuado','📅  Documentação válida por 20 anos','🏢  Sem exceção de porte ou setor'].map(t => (
            <div key={t} style={{display:'flex',alignItems:'center',gap:'9px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px',padding:'9px 18px',color:'#b8d0e8',fontSize:'13px'}}>{t}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'risco',
    num: '2 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>O risco real</div>
        <h2 style={{fontSize:'38px',fontWeight:900,color:'#fff',lineHeight:1.1,marginBottom:'8px',letterSpacing:'-.02em'}}>A multa é o menor<br />dos problemas.</h2>
        <div style={{width:'44px',height:'3px',background:'#17C3C9',borderRadius:'2px',margin:'12px 0 26px'}} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          {[
            {n:'R$ 3,4M', t:'Condenação real', d:'Recife, 2026 — assédio moral organizacional. Dano moral coletivo após inquérito do MPT.', acc:false},
            {n:'R$ 20k/dia', t:'Multa diária', d:'Clínica de médio porte condenada a implantar política preventiva sob multa por descumprimento.', acc:false},
            {n:'Reintegração', t:'TST, 2025', d:'Gerente em licença por burnout — dispensa declarada nula e reintegração imediata determinada.', acc:false},
            {n:'Nexo presumido', t:'Sem documentação, você perde', d:'Qualquer afastamento por ansiedade ou burnout vira ação com culpa presumida contra a empresa.', acc:true},
          ].map(c => (
            <div key={c.t} style={{background:c.acc?'rgba(23,195,201,.07)':'rgba(255,255,255,0.05)',border:`1px solid ${c.acc?'rgba(23,195,201,.4)':'rgba(255,255,255,0.08)'}`,borderRadius:'14px',padding:'22px'}}>
              <div style={{fontSize:c.acc?'17px':'28px',fontWeight:900,color:'#17C3C9',lineHeight:1}}>{c.n}</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#fff',margin:'8px 0 5px'}}>{c.t}</div>
              <div style={{fontSize:'12px',color:'#5e82a0',lineHeight:1.55}}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'solucao',
    num: '3 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>A solução</div>
        <h2 style={{fontSize:'38px',fontWeight:900,color:'#fff',lineHeight:1.1,letterSpacing:'-.02em'}}>Adequação completa.<br />Em poucos dias.</h2>
        <div style={{width:'44px',height:'3px',background:'#17C3C9',borderRadius:'2px',margin:'12px 0 26px'}} />
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {[
            {i:'📋',t:<><strong style={{color:'#fff'}}>DRPS assinado por psicóloga com CRP</strong> — documento com validade legal perante o MTE e a Justiça do Trabalho</>},
            {i:'📊',t:<><strong style={{color:'#fff'}}>Inventário de Riscos Psicossociais</strong> por setor, com análise técnica fundamentada em modelos validados internacionalmente</>},
            {i:'🎯',t:<><strong style={{color:'#fff'}}>Matriz de Risco NR-1 + Plano de Ação</strong> com recomendações priorizadas por criticidade</>},
            {i:'🔒',t:<><strong style={{color:'#fff'}}>100% anônimo para o colaborador</strong> — responde pelo celular, de onde estiver, sem paralisar a operação</>},
          ].map((r,i) => (
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'13px 16px',background:'rgba(255,255,255,.04)',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)'}}>
              <span style={{fontSize:'20px',flexShrink:0,marginTop:'1px'}}>{r.i}</span>
              <span style={{fontSize:'14px',color:'#b8d0e8',lineHeight:1.5}}>{r.t}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'passos',
    num: '4 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>Como funciona</div>
        <h2 style={{fontSize:'38px',fontWeight:900,color:'#fff',lineHeight:1.1,letterSpacing:'-.02em'}}>5 passos. Ninguém<br />para a operação.</h2>
        <div style={{width:'44px',height:'3px',background:'#17C3C9',borderRadius:'2px',margin:'12px 0 28px'}} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0}}>
          {[
            {n:'1',t:'Acesso',d:'Cria a conta na plataforma'},
            {n:'2',t:'Setores',d:'Gera links e QR codes por equipe'},
            {n:'3',t:'Respostas',d:'Colaboradores respondem anonimamente'},
            {n:'4',t:'Análise Técnica',d:'Diagnóstico automático por setor'},
            {n:'5',t:'Documentos',d:'DRPS assinado pronto para download'},
          ].map((s,i) => (
            <div key={s.n} style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative'}}>
              {i < 4 && <div style={{content:'',position:'absolute',top:'22px',left:'62%',width:'76%',height:'1px',background:'rgba(23,195,201,.3)'}} />}
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'#17C3C9',color:'#fff',fontWeight:900,fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>{s.n}</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginTop:'10px'}}>{s.t}</div>
              <div style={{fontSize:'11px',color:'#5e82a0',marginTop:'5px',lineHeight:1.4}}>{s.d}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'28px',background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'13px 20px',textAlign:'center'}}>
          <p style={{color:'#5e82a0',fontSize:'14px'}}>Sem consultor presencial · Sem paralisar a operação · Resultado em dias, não meses</p>
        </div>
      </div>
    ),
  },
  {
    id: 'equipe',
    num: '5 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>Equipe técnica</div>
        <h2 style={{fontSize:'38px',fontWeight:900,color:'#fff',lineHeight:1.1,letterSpacing:'-.02em'}}>Responsabilidade legal<br />em quem assina.</h2>
        <div style={{width:'44px',height:'3px',background:'#17C3C9',borderRadius:'2px',margin:'12px 0 26px'}} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
          {[
            {ini:'RC',nome:'Rafael Coelho',cargo:'Gestão de Projetos',desc:'Condução e entrega do programa de adequação',ft:false,crp:false},
            {ini:'AT',nome:'Annie Talma F. Coelho',cargo:'Psicóloga Responsável Técnica',desc:'Assina o DRPS. Validade legal garantida perante o MTE e a Justiça do Trabalho.',ft:true,crp:true},
            {ini:'TF',nome:'Thiago Ferraz',cargo:'Tecnologia e Plataforma',desc:'Desenvolvimento e operação do sistema Zelo',ft:false,crp:false},
          ].map(p => (
            <div key={p.ini} style={{background:'rgba(255,255,255,.05)',border:`1px solid ${p.ft?'rgba(23,195,201,.5)':'rgba(255,255,255,.08)'}`,borderRadius:'14px',padding:'22px',textAlign:'center'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'18px',margin:'0 auto 12px',background:p.ft?'rgba(23,195,201,.2)':'rgba(30,58,95,.8)',color:p.ft?'#17C3C9':'#7a9bb8'}}>{p.ini}</div>
              <div style={{fontSize:'15px',fontWeight:700,color:'#fff'}}>{p.nome}</div>
              <div style={{fontSize:'11px',color:'#17C3C9',fontWeight:700,margin:'4px 0 8px'}}>{p.cargo}</div>
              <div style={{fontSize:'12px',color:'#5e82a0',lineHeight:1.5}}>{p.desc}</div>
              {p.crp && <div style={{background:'rgba(23,195,201,.1)',border:'1px solid rgba(23,195,201,.3)',borderRadius:'6px',padding:'4px 10px',fontSize:'10px',color:'#17C3C9',fontWeight:700,marginTop:'10px',display:'inline-block',letterSpacing:'.04em'}}>CRP / 05 / 44595</div>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'precos',
    num: '6 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>Investimento</div>
        <h2 style={{fontSize:'38px',fontWeight:900,color:'#fff',lineHeight:1.1,letterSpacing:'-.02em'}}>Muito menos que<br />uma única multa.</h2>
        <div style={{width:'44px',height:'3px',background:'#17C3C9',borderRadius:'2px',margin:'12px 0 20px'}} />
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'rgba(30,58,95,.8)'}}>
              {['Colaboradores CLT','Investimento único','Economia vs. 1 multa'].map(h => (
                <th key={h} style={{color:'#7a9bb8',fontSize:'11px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',padding:'11px 18px',textAlign:'left'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Até 10','R$ 1.497','Poupa até R$ 5.211'],
              ['11 a 30','R$ 1.997','Poupa até R$ 4.711'],
              ['31 a 50','R$ 2.497','Poupa até R$ 4.211'],
              ['51 a 100','R$ 2.997','Poupa até R$ 3.711'],
              ['Acima de 100','Sob consulta','Condição especial'],
            ].map(([f,v,e]) => (
              <tr key={f} style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                <td style={{padding:'12px 18px',color:'#b8d0e8',fontSize:'15px'}}>{f}</td>
                <td style={{padding:'12px 18px',fontWeight:900,color:'#fff',fontSize:'17px'}}>{v}</td>
                <td style={{padding:'12px 18px',color:'#4ade80',fontWeight:700,fontSize:'13px'}}>{e}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'10px',padding:'12px 18px',fontSize:'12px',color:'#5e82a0',marginTop:'14px'}}>
          Referência: multa de <strong style={{color:'#b8d0e8'}}>R$ 6.708,08 por item autuado</strong> (art. 201 CLT) · Portaria MTE nº 1.419/2024
        </div>
      </div>
    ),
  },
  {
    id: 'cta',
    num: '7 / 7',
    content: (
      <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center',alignItems:'center',textAlign:'center'}}>
        <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#17C3C9',marginBottom:'14px'}}>Próximo passo</div>
        <h2 style={{fontSize:'56px',fontWeight:900,color:'#fff',letterSpacing:'-.03em',marginBottom:'16px'}}>Agora.</h2>
        <p style={{color:'#7a9bb8',fontSize:'18px',maxWidth:'500px',lineHeight:1.65,marginBottom:'32px'}}>
          A fiscalização chega por denúncia — sem aviso. A adequação leva dias. O processo trabalhista pode levar anos.
        </p>
        <div style={{background:'#17C3C9',borderRadius:'16px',padding:'32px 48px',maxWidth:'520px',width:'100%'}}>
          <h3 style={{fontSize:'26px',fontWeight:900,color:'#fff',marginBottom:'10px'}}>Começar a adequação hoje</h3>
          <p style={{color:'rgba(255,255,255,.8)',fontSize:'16px',marginBottom:'22px'}}>Acesse agora e tenha o DRPS assinado em dias</p>
          <a href="https://nr1-saas.vercel.app" target="_blank" rel="noopener noreferrer" style={{display:'inline-block',background:'#fff',color:'#ea580c',fontWeight:900,fontSize:'16px',padding:'14px 36px',borderRadius:'10px',textDecoration:'none'}}>
            nr1-saas.vercel.app →
          </a>
        </div>
      </div>
    ),
  },
]

export default function ApresentacaoPage() {
  const [cur, setCur] = useState(0)
  const total = SLIDES.length

  const goTo = useCallback((n: number) => {
    setCur(Math.max(0, Math.min(total - 1, n)))
  }, [total])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setCur(c => Math.min(total - 1, c + 1)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setCur(c => Math.max(0, c - 1)) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [total])

  const slide = SLIDES[cur]

  return (
    <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',background:'#0f1e2e',fontFamily:"'Inter',system-ui,sans-serif",overflow:'hidden'}}>

      {/* Logo */}
      <div style={{position:'absolute',top:'18px',left:'28px',zIndex:10,background:'#fff',padding:'8px 14px',borderRadius:'12px',boxShadow:'0 4px 14px rgba(0,0,0,.25)'}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-zelo-2.png" alt="Zelo" style={{height:'34px',display:'block'}} />
      </div>

      {/* Número do slide */}
      <div style={{position:'absolute',top:'20px',right:'28px',fontSize:'11px',color:'rgba(255,255,255,0.2)',letterSpacing:'.06em',zIndex:10}}>
        {slide.num}
      </div>

      {/* Conteúdo */}
      <div style={{flex:1,padding:'84px 80px 48px',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {slide.content}
      </div>

      {/* Nav */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#0a1520',padding:'14px 32px',borderTop:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        <button
          onClick={() => goTo(cur - 1)}
          disabled={cur === 0}
          style={{background:'none',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'10px 24px',borderRadius:'8px',fontSize:'14px',cursor:cur===0?'default':'pointer',fontFamily:'inherit',opacity:cur===0?0.25:1,transition:'all .15s'}}
        >
          ← Anterior
        </button>

        <div style={{display:'flex',gap:'7px',alignItems:'center'}}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={{width:i===cur?'22px':'7px',height:'7px',borderRadius:i===cur?'4px':'50%',background:i===cur?'#17C3C9':'rgba(255,255,255,0.2)',cursor:'pointer',transition:'all .2s'}}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(cur + 1)}
          disabled={cur === total - 1}
          style={{background:'none',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'10px 24px',borderRadius:'8px',fontSize:'14px',cursor:cur===total-1?'default':'pointer',fontFamily:'inherit',opacity:cur===total-1?0.25:1,transition:'all .15s'}}
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
