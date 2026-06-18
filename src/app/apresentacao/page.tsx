export const metadata = {
  title: 'NR-1 Risk — Apresentação',
}

export default function ApresentacaoPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0a1520; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
        .deck { width: 100vw; height: 100vh; display: flex; flex-direction: column; background: #0f1e2e; }
        .slide { display: none; flex: 1; padding: 60px 80px; flex-direction: column; justify-content: center; position: relative; }
        .slide.active { display: flex; }
        .nav { display: flex; align-items: center; justify-content: space-between; background: #0a1520; padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .nav button { background: none; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: inherit; transition: all .15s; display: flex; align-items: center; gap: 8px; }
        .nav button:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
        .nav button:disabled { opacity: .25; cursor: default; }
        .dots { display: flex; gap: 7px; align-items: center; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: all .2s; }
        .dot.active { background: #f97316; width: 22px; border-radius: 4px; }
        .slide-num { position: absolute; top: 24px; right: 32px; font-size: 12px; color: rgba(255,255,255,0.25); letter-spacing: .06em; }
        .tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(249,115,22,.15); border: 1px solid rgba(249,115,22,.35); color: #f97316; font-size: 11px; font-weight: 700; letter-spacing: .08em; padding: 6px 14px; border-radius: 20px; margin-bottom: 24px; text-transform: uppercase; width: fit-content; }
        .pulse { width: 7px; height: 7px; border-radius: 50%; background: #f97316; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        h1 { font-size: 52px; font-weight: 900; color: #fff; line-height: 1.05; margin-bottom: 20px; letter-spacing: -.02em; }
        h1 span { color: #f97316; }
        h2 { font-size: 40px; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 8px; letter-spacing: -.02em; }
        .sub { font-size: 18px; color: #7a9bb8; line-height: 1.65; max-width: 600px; }
        .sub strong { color: #c0d8ef; }
        .badges { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
        .badge { display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 9px 18px; color: #b8d0e8; font-size: 13px; }
        .badge-icon { color: #f97316; font-size: 18px; }
        .s-label { font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #f97316; margin-bottom: 14px; }
        .divider { width: 44px; height: 3px; background: #f97316; border-radius: 2px; margin: 14px 0 28px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 22px; }
        .card.accent { border-color: rgba(249,115,22,.4); background: rgba(249,115,22,.07); }
        .num { font-size: 30px; font-weight: 900; color: #f97316; line-height: 1; }
        .card-title { font-size: 13px; font-weight: 700; color: #fff; margin: 8px 0 5px; }
        .card-desc { font-size: 12px; color: #5e82a0; line-height: 1.55; }
        .steps { display: grid; grid-template-columns: repeat(5,1fr); gap: 0; margin-top: 24px; }
        .step { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
        .step:not(:last-child)::after { content:''; position: absolute; top: 22px; left: 62%; width: 76%; height: 1px; background: rgba(249,115,22,.3); }
        .step-n { width: 44px; height: 44px; border-radius: 50%; background: #f97316; color: #fff; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
        .step-label { font-size: 13px; font-weight: 700; color: #fff; margin-top: 10px; }
        .step-desc { font-size: 11px; color: #5e82a0; margin-top: 5px; line-height: 1.4; }
        .tbl { width: 100%; border-collapse: collapse; margin-top: 18px; }
        .tbl th { background: rgba(30,58,95,.8); color: #7a9bb8; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 12px 18px; text-align: left; }
        .tbl td { padding: 13px 18px; border-top: 1px solid rgba(255,255,255,0.06); color: #b8d0e8; font-size: 15px; }
        .tbl td.val { font-weight: 900; color: #fff; font-size: 18px; }
        .tbl td.eco { color: #4ade80; font-weight: 700; font-size: 13px; }
        .tbl tr:hover td { background: rgba(255,255,255,.03); }
        .law { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 10px; padding: 13px 18px; font-size: 12px; color: #5e82a0; margin-top: 16px; }
        .law strong { color: #b8d0e8; }
        .ppl { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 24px; }
        .ppl-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 22px; text-align: center; }
        .ppl-card.ft { border-color: rgba(249,115,22,.5); }
        .avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; margin: 0 auto 12px; }
        .av-o { background: rgba(249,115,22,.2); color: #f97316; }
        .av-b { background: rgba(30,58,95,.8); color: #7a9bb8; }
        .ppl-name { font-size: 15px; font-weight: 700; color: #fff; }
        .ppl-role { font-size: 11px; color: #f97316; font-weight: 700; margin: 4px 0 8px; }
        .ppl-desc { font-size: 12px; color: #5e82a0; line-height: 1.5; }
        .crp-badge { background: rgba(249,115,22,.1); border: 1px solid rgba(249,115,22,.3); border-radius: 6px; padding: 4px 10px; font-size: 10px; color: #f97316; font-weight: 700; margin-top: 10px; display: inline-block; letter-spacing: .04em; }
        .includes { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .inc-row { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; background: rgba(255,255,255,.04); border-radius: 10px; border: 1px solid rgba(255,255,255,.06); }
        .inc-icon { color: #f97316; font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        .inc-text { font-size: 14px; color: #b8d0e8; line-height: 1.5; }
        .inc-text strong { color: #fff; }
        .cta-box { background: #f97316; border-radius: 16px; padding: 36px 48px; text-align: center; margin-top: 28px; }
        .cta-box h3 { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 10px; letter-spacing: -.01em; }
        .cta-box p { color: rgba(255,255,255,.8); font-size: 16px; margin-bottom: 22px; }
        .cta-btn { display: inline-block; background: #fff; color: #ea580c; font-weight: 900; font-size: 16px; padding: 14px 36px; border-radius: 10px; text-decoration: none; letter-spacing: -.01em; }
        .arrow-icon { display: inline-block; margin-left: 6px; }
      `}</style>

      <div className="deck" id="deck">

        {/* Slide 1 — Abertura */}
        <div className="slide active" id="s1">
          <div className="slide-num">1 / 7</div>
          <div className="tag"><span className="pulse" />&nbsp;Norma em vigor desde 26/05/2026</div>
          <h1>Sua empresa tem<br /><span>funcionário CLT?</span><br />Você precisa ver isso.</h1>
          <p className="sub">A NR-1 passou a exigir o diagnóstico de riscos psicossociais de <strong>toda</strong> empresa com ao menos 1 funcionário CLT. Quem não cumprir responde com multa e processo trabalhista.</p>
          <div className="badges">
            <div className="badge"><span className="badge-icon">⚠️</span>Multa de R$ 6.708 por item autuado</div>
            <div className="badge"><span className="badge-icon">📅</span>Documentação válida por 20 anos</div>
            <div className="badge"><span className="badge-icon">🏢</span>Sem exceção de porte ou setor</div>
          </div>
        </div>

        {/* Slide 2 — Risco real */}
        <div className="slide" id="s2">
          <div className="slide-num">2 / 7</div>
          <div className="s-label">O risco real</div>
          <h2>A multa é o menor<br />dos problemas.</h2>
          <div className="divider" />
          <div className="grid2">
            <div className="card">
              <div className="num">R$ 3,4M</div>
              <div className="card-title">Condenação real</div>
              <div className="card-desc">Recife, 2026 — assédio moral organizacional. Dano moral coletivo após inquérito do MPT.</div>
            </div>
            <div className="card">
              <div className="num">R$ 20k/dia</div>
              <div className="card-title">Multa diária</div>
              <div className="card-desc">Clínica de médio porte condenada a implantar política preventiva. Multa por cada dia de descumprimento.</div>
            </div>
            <div className="card">
              <div className="num">Reintegração</div>
              <div className="card-title">TST, 2025</div>
              <div className="card-desc">Gerente em licença por burnout — dispensa declarada nula. Reintegração imediata determinada.</div>
            </div>
            <div className="card accent">
              <div className="num" style={{fontSize:'18px',lineHeight:'1.4'}}>Nexo presumido</div>
              <div className="card-title">Sem documentação, você perde</div>
              <div className="card-desc">Qualquer afastamento por ansiedade ou burnout vira ação com culpa presumida contra a empresa.</div>
            </div>
          </div>
        </div>

        {/* Slide 3 — A solução */}
        <div className="slide" id="s3">
          <div className="slide-num">3 / 7</div>
          <div className="s-label">A solução</div>
          <h2>Adequação completa.<br />Em poucos dias.</h2>
          <div className="divider" />
          <div className="includes">
            <div className="inc-row"><span className="inc-icon">📋</span><span className="inc-text"><strong>DRPS assinado por psicóloga com CRP</strong> — documento com validade legal perante o MTE e a Justiça do Trabalho</span></div>
            <div className="inc-row"><span className="inc-icon">📊</span><span className="inc-text"><strong>Inventário de Riscos Psicossociais</strong> por setor, com análise por inteligência artificial</span></div>
            <div className="inc-row"><span className="inc-icon">🎯</span><span className="inc-text"><strong>Matriz de Risco NR-1 + Plano de Ação</strong> com recomendações priorizadas por criticidade</span></div>
            <div className="inc-row"><span className="inc-icon">🔒</span><span className="inc-text"><strong>100% anônimo para o colaborador</strong> — responde pelo celular, de onde estiver, sem paralisar a operação</span></div>
          </div>
        </div>

        {/* Slide 4 — Como funciona */}
        <div className="slide" id="s4">
          <div className="slide-num">4 / 7</div>
          <div className="s-label">Como funciona</div>
          <h2>5 passos. Ninguém<br />para a operação.</h2>
          <div className="divider" />
          <div className="steps">
            {[
              {n:'1', t:'Acesso', d:'Cria a conta na plataforma'},
              {n:'2', t:'Setores', d:'Gera links e QR codes por equipe'},
              {n:'3', t:'Respostas', d:'Colaboradores respondem anonimamente'},
              {n:'4', t:'Análise IA', d:'Diagnóstico automático por setor'},
              {n:'5', t:'Documentos', d:'DRPS assinado pronto para download'},
            ].map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <div className="step-label">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'28px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'14px 20px',textAlign:'center'}}>
            <p style={{color:'#5e82a0',fontSize:'14px'}}>Sem consultor presencial &nbsp;·&nbsp; Sem paralisar a operação &nbsp;·&nbsp; Resultado em dias, não meses</p>
          </div>
        </div>

        {/* Slide 5 — Equipe */}
        <div className="slide" id="s5">
          <div className="slide-num">5 / 7</div>
          <div className="s-label">Equipe técnica</div>
          <h2>Responsabilidade legal<br />em quem assina.</h2>
          <div className="divider" />
          <div className="ppl">
            <div className="ppl-card">
              <div className="avatar av-b">RC</div>
              <div className="ppl-name">Rafael Coelho</div>
              <div className="ppl-role">Gestão de Projetos</div>
              <div className="ppl-desc">Condução e entrega do programa de adequação</div>
            </div>
            <div className="ppl-card ft">
              <div className="avatar av-o">AT</div>
              <div className="ppl-name">Annie Talma F. Coelho</div>
              <div className="ppl-role">Psicóloga Responsável Técnica</div>
              <div className="ppl-desc">Assina o DRPS. Validade legal garantida perante o MTE e a Justiça do Trabalho.</div>
              <div className="crp-badge">CRP / 05 / 44595</div>
            </div>
            <div className="ppl-card">
              <div className="avatar av-b">TF</div>
              <div className="ppl-name">Thiago Ferraz</div>
              <div className="ppl-role">Tecnologia e Plataforma</div>
              <div className="ppl-desc">Desenvolvimento e operação do sistema NR-1 Risk</div>
            </div>
          </div>
        </div>

        {/* Slide 6 — Preços */}
        <div className="slide" id="s6">
          <div className="slide-num">6 / 7</div>
          <div className="s-label">Investimento</div>
          <h2>Muito menos que<br />uma única multa.</h2>
          <div className="divider" />
          <table className="tbl">
            <thead>
              <tr><th>Colaboradores CLT</th><th>Investimento único</th><th>Economia vs. 1 multa</th></tr>
            </thead>
            <tbody>
              {[
                ['Até 10','R$ 1.497','Poupa até R$ 5.211'],
                ['11 a 30','R$ 1.997','Poupa até R$ 4.711'],
                ['31 a 50','R$ 2.497','Poupa até R$ 4.211'],
                ['51 a 100','R$ 2.997','Poupa até R$ 3.711'],
                ['Acima de 100','Sob consulta','Condição especial'],
              ].map(([f,v,e]) => (
                <tr key={f}><td>{f}</td><td className="val">{v}</td><td className="eco">{e}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="law">Referência: multa de <strong>R$ 6.708,08 por item autuado</strong> (art. 201 CLT) · Portaria MTE nº 1.419/2024</div>
        </div>

        {/* Slide 7 — CTA */}
        <div className="slide" id="s7">
          <div className="slide-num">7 / 7</div>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center',alignItems:'center'}}>
            <div className="s-label" style={{textAlign:'center'}}>Próximo passo</div>
            <h2 style={{fontSize:'56px',marginBottom:'16px'}}>Agora.</h2>
            <p style={{color:'#7a9bb8',fontSize:'18px',maxWidth:'520px',margin:'0 auto 36px',lineHeight:'1.65'}}>
              A fiscalização chega por denúncia de funcionário — sem aviso. A adequação leva poucos dias. O processo trabalhista pode levar anos.
            </p>
            <div className="cta-box" style={{maxWidth:'560px',width:'100%'}}>
              <h3>Começar a adequação hoje</h3>
              <p>Acesse agora e tenha o DRPS assinado em dias</p>
              <a href="https://nr1-saas.vercel.app" className="cta-btn" target="_blank" rel="noopener noreferrer">
                nr1-saas.vercel.app <span className="arrow-icon">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="nav">
          <button id="btnPrev" onClick={() => {}} disabled>← Anterior</button>
          <div className="dots" id="dotsContainer" />
          <button id="btnNext" onClick={() => {}}>Próximo →</button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        var cur = 0, total = 7;
        var dotsEl = document.getElementById('dotsContainer');
        for (var i = 0; i < total; i++) {
          var d = document.createElement('div');
          d.className = 'dot' + (i === 0 ? ' active' : '');
          d.setAttribute('data-i', i);
          (function(idx) { d.addEventListener('click', function() { goTo(idx); }); })(i);
          dotsEl.appendChild(d);
        }
        function goTo(n) {
          document.querySelectorAll('.slide')[cur].classList.remove('active');
          cur = Math.max(0, Math.min(total - 1, n));
          document.querySelectorAll('.slide')[cur].classList.add('active');
          document.querySelectorAll('.dot').forEach(function(d, i) { d.classList.toggle('active', i === cur); });
          document.getElementById('btnPrev').disabled = cur === 0;
          document.getElementById('btnNext').disabled = cur === total - 1;
        }
        document.getElementById('btnPrev').addEventListener('click', function() { goTo(cur - 1); });
        document.getElementById('btnNext').addEventListener('click', function() { goTo(cur + 1); });
        document.addEventListener('keydown', function(e) {
          if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(cur + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); }
        });
      `}} />
    </>
  )
}
