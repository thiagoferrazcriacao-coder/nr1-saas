export const metadata = {
  title: 'NR-1 Risk — Apresentação',
}

const steps = [
  { n: '1', t: 'Acesso',      d: 'Cria a conta na plataforma' },
  { n: '2', t: 'Setores',     d: 'Gera links e QR codes por equipe' },
  { n: '3', t: 'Respostas',   d: 'Colaboradores respondem anonimamente' },
  { n: '4', t: 'Análise IA',  d: 'Diagnóstico automático por setor' },
  { n: '5', t: 'Documentos',  d: 'DRPS assinado pronto para download' },
]

const precos: { faixa: string; valor: string; eco: string }[] = [
  { faixa: 'Até 10',         valor: 'R$ 1.497',      eco: 'Poupa até R$ 5.211' },
  { faixa: '11 a 30',        valor: 'R$ 1.997',      eco: 'Poupa até R$ 4.711' },
  { faixa: '31 a 50',        valor: 'R$ 2.497',      eco: 'Poupa até R$ 4.211' },
  { faixa: '51 a 100',       valor: 'R$ 2.997',      eco: 'Poupa até R$ 3.711' },
  { faixa: 'Acima de 100',   valor: 'Sob consulta',  eco: 'Condição especial' },
]

export default function ApresentacaoPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a1520;font-family:'Inter',system-ui,sans-serif;overflow:hidden}
        .deck{width:100vw;height:100vh;display:flex;flex-direction:column;background:#0f1e2e}
        .slide{display:none;flex:1;padding:56px 80px;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
        .slide.active{display:flex}
        .nav{display:flex;align-items:center;justify-content:space-between;background:#0a1520;padding:14px 32px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0}
        .nav button{background:none;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s}
        .nav button:hover:not(:disabled){background:rgba(255,255,255,0.08)}
        .nav button:disabled{opacity:.25;cursor:default}
        .dots{display:flex;gap:7px;align-items:center}
        .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.2);cursor:pointer;transition:all .2s}
        .dot.active{background:#f97316;width:22px;border-radius:4px}
        .sn{position:absolute;top:22px;right:32px;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:.06em}
        .tag{display:inline-flex;align-items:center;gap:8px;background:rgba(249,115,22,.15);border:1px solid rgba(249,115,22,.35);color:#f97316;font-size:11px;font-weight:700;letter-spacing:.08em;padding:6px 14px;border-radius:20px;margin-bottom:24px;width:fit-content;text-transform:uppercase}
        .pulse{width:7px;height:7px;border-radius:50%;background:#f97316;animation:pulse 1.5s infinite;display:inline-block}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        h1{font-size:50px;font-weight:900;color:#fff;line-height:1.05;margin-bottom:20px;letter-spacing:-.02em}
        h1 span{color:#f97316}
        h2{font-size:38px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:8px;letter-spacing:-.02em}
        .sub{font-size:18px;color:#7a9bb8;line-height:1.65;max-width:600px}
        .sub strong{color:#c0d8ef}
        .badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
        .badge{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:9px 18px;color:#b8d0e8;font-size:13px}
        .slabel{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#f97316;margin-bottom:14px}
        .div{width:44px;height:3px;background:#f97316;border-radius:2px;margin:12px 0 26px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px}
        .card-acc{background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.4);border-radius:14px;padding:22px}
        .num{font-size:28px;font-weight:900;color:#f97316;line-height:1}
        .num-sm{font-size:17px;font-weight:900;color:#f97316;line-height:1.3}
        .ct{font-size:13px;font-weight:700;color:#fff;margin:8px 0 5px}
        .cd{font-size:12px;color:#5e82a0;line-height:1.55}
        .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:24px}
        .step{display:flex;flex-direction:column;align-items:center;text-align:center;position:relative}
        .step:not(:last-child)::after{content:'';position:absolute;top:22px;left:62%;width:76%;height:1px;background:rgba(249,115,22,.3)}
        .snum{width:44px;height:44px;border-radius:50%;background:#f97316;color:#fff;font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
        .slbl{font-size:13px;font-weight:700;color:#fff;margin-top:10px}
        .sdesc{font-size:11px;color:#5e82a0;margin-top:5px;line-height:1.4}
        .tbl{width:100%;border-collapse:collapse;margin-top:18px}
        .tbl th{background:rgba(30,58,95,.8);color:#7a9bb8;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:11px 18px;text-align:left}
        .tbl td{padding:12px 18px;border-top:1px solid rgba(255,255,255,0.06);color:#b8d0e8;font-size:15px}
        .tval{font-weight:900;color:#fff;font-size:17px}
        .teco{color:#4ade80;font-weight:700;font-size:13px}
        .tbl tr:hover td{background:rgba(255,255,255,.03)}
        .law{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 18px;font-size:12px;color:#5e82a0;margin-top:14px}
        .law strong{color:#b8d0e8}
        .ppl{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}
        .pc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:22px;text-align:center}
        .pc-ft{background:rgba(255,255,255,.05);border:1px solid rgba(249,115,22,.5);border-radius:14px;padding:22px;text-align:center}
        .av{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;margin:0 auto 12px}
        .av-o{background:rgba(249,115,22,.2);color:#f97316}
        .av-b{background:rgba(30,58,95,.8);color:#7a9bb8}
        .pn{font-size:15px;font-weight:700;color:#fff}
        .pr{font-size:11px;color:#f97316;font-weight:700;margin:4px 0 8px}
        .pd{font-size:12px;color:#5e82a0;line-height:1.5}
        .crp{background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3);border-radius:6px;padding:4px 10px;font-size:10px;color:#f97316;font-weight:700;margin-top:10px;display:inline-block;letter-spacing:.04em}
        .inc{display:flex;flex-direction:column;gap:10px;margin-top:18px}
        .ir{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid rgba(255,255,255,.06)}
        .ii{color:#f97316;font-size:20px;flex-shrink:0;margin-top:1px}
        .it{font-size:14px;color:#b8d0e8;line-height:1.5}
        .it strong{color:#fff}
        .cta-box{background:#f97316;border-radius:16px;padding:32px 48px;text-align:center;margin-top:28px;max-width:560px;width:100%}
        .cta-box h3{font-size:26px;font-weight:900;color:#fff;margin-bottom:10px}
        .cta-box p{color:rgba(255,255,255,.8);font-size:16px;margin-bottom:22px}
        .cta-btn{display:inline-block;background:#fff;color:#ea580c;font-weight:900;font-size:16px;padding:14px 36px;border-radius:10px;text-decoration:none}
        .hint{background:rgba(255,255,255,.04);border-radius:10px;padding:13px 20px;text-align:center}
        .hint p{color:#5e82a0;font-size:14px}
      `}</style>

      <div className="deck" id="deck">

        <div className="slide active" id="s0">
          <div className="sn">1 / 7</div>
          <div className="tag"><span className="pulse" />&nbsp;Norma em vigor desde 26/05/2026</div>
          <h1>Sua empresa tem<br /><span>funcionário CLT?</span><br />Você precisa ver isso.</h1>
          <p className="sub">A NR-1 passou a exigir o diagnóstico de riscos psicossociais de <strong>toda</strong> empresa com ao menos 1 funcionário CLT. Quem não cumprir responde com multa e processo trabalhista.</p>
          <div className="badges">
            <div className="badge"><span>⚠️</span>Multa de R$ 6.708 por item autuado</div>
            <div className="badge"><span>📅</span>Documentação válida por 20 anos</div>
            <div className="badge"><span>🏢</span>Sem exceção de porte ou setor</div>
          </div>
        </div>

        <div className="slide" id="s1">
          <div className="sn">2 / 7</div>
          <div className="slabel">O risco real</div>
          <h2>A multa é o menor<br />dos problemas.</h2>
          <div className="div" />
          <div className="grid2">
            <div className="card"><div className="num">R$ 3,4M</div><div className="ct">Condenação real</div><div className="cd">Recife, 2026 — assédio moral organizacional. Dano moral coletivo após inquérito do MPT.</div></div>
            <div className="card"><div className="num">R$ 20k/dia</div><div className="ct">Multa diária</div><div className="cd">Clínica de médio porte condenada a implantar política preventiva sob multa por descumprimento.</div></div>
            <div className="card"><div className="num">Reintegração</div><div className="ct">TST, 2025</div><div className="cd">Gerente em licença por burnout — dispensa declarada nula e reintegração imediata determinada.</div></div>
            <div className="card-acc"><div className="num-sm">Nexo presumido</div><div className="ct">Sem documentação, você perde</div><div className="cd">Qualquer afastamento por ansiedade ou burnout vira ação com culpa presumida contra a empresa.</div></div>
          </div>
        </div>

        <div className="slide" id="s2">
          <div className="sn">3 / 7</div>
          <div className="slabel">A solução</div>
          <h2>Adequação completa.<br />Em poucos dias.</h2>
          <div className="div" />
          <div className="inc">
            <div className="ir"><span className="ii">📋</span><span className="it"><strong>DRPS assinado por psicóloga com CRP</strong> — documento com validade legal perante o MTE e a Justiça do Trabalho</span></div>
            <div className="ir"><span className="ii">📊</span><span className="it"><strong>Inventário de Riscos Psicossociais</strong> por setor, com análise por inteligência artificial</span></div>
            <div className="ir"><span className="ii">🎯</span><span className="it"><strong>Matriz de Risco NR-1 + Plano de Ação</strong> com recomendações priorizadas por criticidade</span></div>
            <div className="ir"><span className="ii">🔒</span><span className="it"><strong>100% anônimo para o colaborador</strong> — responde pelo celular, de onde estiver, sem paralisar a operação</span></div>
          </div>
        </div>

        <div className="slide" id="s3">
          <div className="sn">4 / 7</div>
          <div className="slabel">Como funciona</div>
          <h2>5 passos. Ninguém<br />para a operação.</h2>
          <div className="div" />
          <div className="steps">
            {steps.map((s) => (
              <div key={s.n} className="step">
                <div className="snum">{s.n}</div>
                <div className="slbl">{s.t}</div>
                <div className="sdesc">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="hint" style={{marginTop:'26px'}}>
            <p>Sem consultor presencial &nbsp;·&nbsp; Sem paralisar a operação &nbsp;·&nbsp; Resultado em dias, não meses</p>
          </div>
        </div>

        <div className="slide" id="s4">
          <div className="sn">5 / 7</div>
          <div className="slabel">Equipe técnica</div>
          <h2>Responsabilidade legal<br />em quem assina.</h2>
          <div className="div" />
          <div className="ppl">
            <div className="pc">
              <div className="av av-b">RC</div>
              <div className="pn">Rafael Coelho</div>
              <div className="pr">Gestão de Projetos</div>
              <div className="pd">Condução e entrega do programa de adequação</div>
            </div>
            <div className="pc-ft">
              <div className="av av-o">AT</div>
              <div className="pn">Annie Talma F. Coelho</div>
              <div className="pr">Psicóloga Responsável Técnica</div>
              <div className="pd">Assina o DRPS. Validade legal garantida perante o MTE e a Justiça do Trabalho.</div>
              <div className="crp">CRP / 05 / 44595</div>
            </div>
            <div className="pc">
              <div className="av av-b">TF</div>
              <div className="pn">Thiago Ferraz</div>
              <div className="pr">Tecnologia e Plataforma</div>
              <div className="pd">Desenvolvimento e operação do sistema NR-1 Risk</div>
            </div>
          </div>
        </div>

        <div className="slide" id="s5">
          <div className="sn">6 / 7</div>
          <div className="slabel">Investimento</div>
          <h2>Muito menos que<br />uma única multa.</h2>
          <div className="div" />
          <table className="tbl">
            <thead>
              <tr><th>Colaboradores CLT</th><th>Investimento único</th><th>Economia vs. 1 multa</th></tr>
            </thead>
            <tbody>
              {precos.map((p) => (
                <tr key={p.faixa}>
                  <td>{p.faixa}</td>
                  <td className="tval">{p.valor}</td>
                  <td className="teco">{p.eco}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="law">Referência: multa de <strong>R$ 6.708,08 por item autuado</strong> (art. 201 CLT) · Portaria MTE nº 1.419/2024</div>
        </div>

        <div className="slide" id="s6">
          <div className="sn">7 / 7</div>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center',alignItems:'center'}}>
            <div className="slabel" style={{textAlign:'center'}}>Próximo passo</div>
            <h2 style={{fontSize:'56px',marginBottom:'16px'}}>Agora.</h2>
            <p style={{color:'#7a9bb8',fontSize:'18px',maxWidth:'500px',margin:'0 auto 32px',lineHeight:'1.65'}}>
              A fiscalização chega por denúncia — sem aviso. A adequação leva dias. O processo trabalhista pode levar anos.
            </p>
            <div className="cta-box">
              <h3>Começar a adequação hoje</h3>
              <p>Acesse agora e tenha o DRPS assinado em dias</p>
              <a href="https://nr1-saas.vercel.app" className="cta-btn" target="_blank" rel="noopener noreferrer">
                nr1-saas.vercel.app →
              </a>
            </div>
          </div>
        </div>

        <div className="nav">
          <button id="btnPrev" disabled>← Anterior</button>
          <div className="dots" id="dotsEl" />
          <button id="btnNext">Próximo →</button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        var cur=0,total=7;
        var dotsEl=document.getElementById('dotsEl');
        for(var i=0;i<total;i++){
          var d=document.createElement('div');
          d.className='dot'+(i===0?' active':'');
          (function(idx){d.addEventListener('click',function(){goTo(idx);})})(i);
          dotsEl.appendChild(d);
        }
        function goTo(n){
          document.querySelectorAll('.slide')[cur].classList.remove('active');
          cur=Math.max(0,Math.min(total-1,n));
          document.querySelectorAll('.slide')[cur].classList.add('active');
          document.querySelectorAll('.dot').forEach(function(d,i){d.classList.toggle('active',i===cur);});
          document.getElementById('btnPrev').disabled=cur===0;
          document.getElementById('btnNext').disabled=cur===total-1;
        }
        document.getElementById('btnPrev').addEventListener('click',function(){goTo(cur-1);});
        document.getElementById('btnNext').addEventListener('click',function(){goTo(cur+1);});
        document.addEventListener('keydown',function(e){
          if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();goTo(cur+1);}
          if(e.key==='ArrowLeft'){e.preventDefault();goTo(cur-1);}
        });
      `}} />
    </>
  )
}
