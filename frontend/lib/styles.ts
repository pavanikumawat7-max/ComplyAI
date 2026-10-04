export const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg0:#08080B;--bg1:#0F0F13;--bg2:#141418;--bg3:#1C1C22;--bg4:#242429;
    --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.11);
    --text:#EEECEA;--muted:#7A7875;--subtle:#3E3D3A;
    --orange:#E8541A;--orange-light:#F07340;--orange-dim:rgba(232,84,26,0.08);
    --green:#2EC07A;--green-dim:rgba(46,192,122,0.1);
    --yellow:#E8B840;--yellow-dim:rgba(232,184,64,0.1);
    --red:#E24B4A;--red-dim:rgba(226,75,74,0.1);
    --blue:#3B8BEB;--blue-dim:rgba(59,139,235,0.1);
    --purple:#9B6DFF;--purple-dim:rgba(155,109,255,0.1);
    --font-d:'Syne',sans-serif;--font-m:'JetBrains Mono',monospace;
  }
  body { background:var(--bg0);color:var(--text);font-family:var(--font-d);font-size:13px;line-height:1.5;min-height:100vh; }
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:4px}
  .app{display:flex;height:100vh;overflow:hidden}
  .sidebar{width:210px;background:var(--bg1);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0}
  .sb-logo{padding:20px 18px 16px;border-bottom:1px solid var(--border)}
  .sb-logo-mark{font-size:17px;font-weight:800;letter-spacing:0.04em;color:var(--orange)}
  .sb-logo-sub{font-family:var(--font-m);font-size:9px;color:var(--subtle);letter-spacing:0.14em;margin-top:2px;text-transform:uppercase}
  .sb-new-btn{margin:12px 14px 4px;background:var(--orange);color:#fff;border:none;border-radius:6px;padding:9px 14px;font-family:var(--font-d);font-size:12px;font-weight:600;cursor:pointer;width:calc(100% - 28px);text-align:left;letter-spacing:0.02em;transition:background .15s;display:flex;align-items:center;gap:7px}
  .sb-new-btn:hover{background:var(--orange-light)}
  .sb-section{padding:8px 0 4px}
  .sb-group-label{font-family:var(--font-m);font-size:9px;color:var(--subtle);letter-spacing:0.13em;text-transform:uppercase;padding:4px 18px 6px}
  .sb-item{display:flex;align-items:center;gap:9px;padding:8px 18px;font-size:12.5px;font-weight:500;color:var(--muted);cursor:pointer;border-left:2px solid transparent;transition:all .12s;user-select:none}
  .sb-item:hover{color:var(--text);background:rgba(255,255,255,0.025)}
  .sb-item.active{color:var(--text);border-left-color:var(--orange);background:var(--orange-dim)}
  .sb-badge{margin-left:auto;background:var(--red-dim);color:var(--red);font-family:var(--font-m);font-size:9px;padding:2px 5px;border-radius:3px;border:1px solid rgba(226,75,74,0.2)}
  .sb-divider{height:1px;background:var(--border);margin:6px 0}
  .sb-footer{margin-top:auto;padding:14px 18px;border-top:1px solid var(--border)}
  .sb-footer-label{font-family:var(--font-m);font-size:9px;color:var(--subtle);letter-spacing:0.1em;margin-bottom:6px;text-transform:uppercase}
  .sb-footer-org{font-size:12px;font-weight:600;color:var(--text)}
  .sb-footer-env{font-family:var(--font-m);font-size:10px;color:var(--muted);margin-top:1px}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .topbar{height:50px;border-bottom:1px solid var(--border);background:var(--bg1);display:flex;align-items:center;padding:0 22px;gap:14px;flex-shrink:0}
  .topbar-title{font-size:13px;font-weight:700;color:var(--text);letter-spacing:0.01em}
  .topbar-breadcrumb{font-family:var(--font-m);font-size:10px;color:var(--subtle)}
  .topbar-right{margin-left:auto;display:flex;align-items:center;gap:10px}
  .pill{font-family:var(--font-m);font-size:10px;padding:4px 9px;border-radius:4px;border:1px solid;font-weight:500;letter-spacing:0.04em}
  .pill-red{color:var(--red);border-color:rgba(226,75,74,0.3);background:var(--red-dim)}
  .pill-green{color:var(--green);border-color:rgba(46,192,122,0.3);background:var(--green-dim)}
  .pill-yellow{color:var(--yellow);border-color:rgba(232,184,64,0.3);background:var(--yellow-dim)}
  .pill-orange{color:var(--orange);border-color:rgba(232,84,26,0.3);background:var(--orange-dim)}
  .topbar-time{font-family:var(--font-m);font-size:10px;color:var(--muted)}
  .avatar{width:28px;height:28px;border-radius:50%;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--muted)}
  .content{flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:16px}
  .panel{background:var(--bg1);border:1px solid var(--border);border-radius:8px;overflow:hidden}
  .panel-header{padding:13px 16px 11px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
  .panel-title{font-size:12px;font-weight:700;letter-spacing:0.02em}
  .panel-sub{font-family:var(--font-m);font-size:10px;color:var(--muted);margin-left:auto}
  .panel-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .dot-live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .metrics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .metric-card{background:var(--bg1);border:1px solid var(--border);border-radius:8px;padding:15px 16px;position:relative;overflow:hidden;transition:border-color .2s}
  .metric-card:hover{border-color:var(--border2)}
  .metric-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:8px 8px 0 0}
  .mc-label{font-family:var(--font-m);font-size:9px;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px}
  .mc-value{font-family:var(--font-m);font-size:26px;font-weight:400;letter-spacing:-0.03em;line-height:1}
  .mc-meta{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-top:8px}
  .section-label{font-family:var(--font-m);font-size:9px;color:var(--subtle);letter-spacing:0.14em;text-transform:uppercase;display:flex;align-items:center;gap:10px}
  .section-label::after{content:'';flex:1;height:1px;background:var(--border)}
  .row-2-1{display:grid;grid-template-columns:1fr 300px;gap:14px}
  .row-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  .row-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade-in{animation:fadeUp 0.35s ease both}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .shimmer{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:3px}

  /* RISK */
  .risk-body{padding:14px 16px 16px}
  .risk-score-row{display:flex;align-items:flex-end;gap:10px;margin-bottom:14px}
  .risk-score{font-family:var(--font-m);font-size:42px;font-weight:300;line-height:1;letter-spacing:-0.04em}
  .risk-score-sub{font-family:var(--font-m);font-size:10px;color:var(--muted);padding-bottom:6px}
  .risk-track{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:6px}
  .risk-fill{height:100%;border-radius:3px;transition:width 1.4s cubic-bezier(0.16,1,0.3,1)}
  .risk-labels{display:flex;justify-content:space-between}
  .risk-label-item{font-family:var(--font-m);font-size:9px;color:var(--subtle)}
  .risk-segments{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
  .risk-seg{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px 11px}
  .risk-seg-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px}
  .risk-seg-val{font-family:var(--font-m);font-size:17px;font-weight:400}
  .risk-seg-bar{height:3px;background:var(--bg4);border-radius:2px;margin-top:7px;overflow:hidden}
  .risk-seg-fill{height:100%;border-radius:2px}

  /* ACTIVITY */
  .act-item{display:flex;gap:11px;padding:10px 16px;border-right:1px solid var(--border);border-bottom:none;align-items:flex-start;flex-direction:column;gap:7px;transition:background .12s;cursor:default}
  .act-item:hover{background:rgba(255,255,255,0.02)}
  .act-icon{width:26px;height:26px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;margin-top:1px}
  .act-icon-warn{background:var(--yellow-dim);color:var(--yellow);border:1px solid rgba(232,184,64,0.2)}
  .act-icon-info{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(59,139,235,0.2)}
  .act-icon-ok{background:var(--green-dim);color:var(--green);border:1px solid rgba(46,192,122,0.2)}
  .act-icon-err{background:var(--red-dim);color:var(--red);border:1px solid rgba(226,75,74,0.2)}
  .act-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.3}
  .act-time{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-top:2px}
  .act-tag{font-family:var(--font-m);font-size:9px;padding:2px 6px;border-radius:3px;display:inline-block}

  /* FINDING CARDS */
  .finding-card{background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:13px;cursor:pointer;transition:all .15s;position:relative}
  .finding-card:hover{border-color:var(--border2);background:var(--bg3)}
  .finding-card.selected{border-color:var(--orange);background:var(--orange-dim)}
  .finding-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
  .finding-sev{font-family:var(--font-m);font-size:8px;padding:3px 7px;border-radius:3px;font-weight:500;letter-spacing:0.08em;flex-shrink:0;margin-top:1px}
  .finding-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.3}
  .finding-desc{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-bottom:10px;line-height:1.5}
  .finding-footer{display:flex;align-items:center;gap:8px}
  .fix-btn{font-family:var(--font-m);font-size:10px;padding:5px 11px;border-radius:5px;background:var(--orange);color:#fff;border:none;cursor:pointer;font-weight:500;letter-spacing:0.03em;transition:background .15s;display:flex;align-items:center;gap:5px}
  .fix-btn:hover{background:var(--orange-light)}
  .fix-btn.secondary{background:var(--bg3);color:var(--muted);border:1px solid var(--border2)}
  .fix-btn.secondary:hover{color:var(--text);background:var(--bg4)}

  /* AI FIX MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px}
  .modal{background:var(--bg1);border:1px solid var(--border2);border-radius:10px;width:680px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.6)}
  .modal-header{padding:16px 18px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
  .modal-title{font-size:13px;font-weight:700}
  .modal-close{margin-left:auto;background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px}
  .modal-close:hover{color:var(--text)}
  .modal-body{flex:1;overflow-y:auto;padding:16px 18px}
  .modal-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:16px}
  .modal-tab{font-family:var(--font-m);font-size:10px;padding:8px 14px;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;transition:all .12s;letter-spacing:0.06em;text-transform:uppercase}
  .modal-tab.active{color:var(--orange);border-bottom-color:var(--orange)}
  .modal-tab:hover{color:var(--text)}
  .policy-block{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:14px;font-family:var(--font-m);font-size:10px;color:var(--muted);line-height:1.8;white-space:pre-wrap}
  .policy-block strong{color:var(--text);font-weight:500}
  .checklist-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
  .checklist-item:last-child{border-bottom:none}
  .check-box{width:16px;height:16px;border:1px solid var(--border2);border-radius:3px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;margin-top:1px}
  .check-box.checked{background:var(--green);border-color:var(--green)}
  .check-text{font-size:12px;color:var(--text);flex:1}
  .check-time{font-family:var(--font-m);font-size:9px;color:var(--subtle)}
  .action-step{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
  .action-step:last-child{border-bottom:none}
  .action-num{width:22px;height:22px;border-radius:50%;background:var(--orange-dim);border:1px solid rgba(232,84,26,0.3);color:var(--orange);font-family:var(--font-m);font-size:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .action-content{flex:1}
  .action-title{font-size:12px;font-weight:600;color:var(--text);margin-bottom:2px}
  .action-desc{font-family:var(--font-m);font-size:10px;color:var(--subtle);line-height:1.5}
  .action-tag{font-family:var(--font-m);font-size:9px;padding:2px 7px;border-radius:3px;background:var(--bg3);color:var(--muted);border:1px solid var(--border2);margin-top:6px;display:inline-block}
  .ai-typing{display:flex;align-items:center;gap:8px;padding:20px;color:var(--muted);font-family:var(--font-m);font-size:11px}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
  .blink-dot{width:5px;height:5px;border-radius:50%;background:var(--orange);animation:blink 1.2s ease infinite}
  .blink-dot:nth-child(2){animation-delay:0.2s}
  .blink-dot:nth-child(3){animation-delay:0.4s}

  /* WHAT-IF SIMULATOR */
  .sim-body{padding:16px}
  .sim-grid{display:grid;grid-template-columns:280px 1fr;gap:14px}
  .sim-controls{background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:14px}
  .sim-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}
  .sim-select{width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--font-d);font-size:12px;padding:8px 10px;border-radius:5px;cursor:pointer;outline:none;margin-bottom:12px}
  .sim-select:focus{border-color:var(--orange)}
  .sim-run-btn{width:100%;background:var(--orange);color:#fff;border:none;border-radius:5px;padding:9px;font-family:var(--font-d);font-size:12px;font-weight:600;cursor:pointer;transition:background .15s}
  .sim-run-btn:hover{background:var(--orange-light)}
  .sim-impact{display:flex;flex-direction:column;gap:10px}
  .sim-impact-card{background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:12px 14px;transition:border-color .3s}
  .sim-impact-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}
  .sim-impact-val{font-family:var(--font-m);font-size:22px;font-weight:300;line-height:1}
  .sim-impact-delta{font-family:var(--font-m);font-size:10px;margin-top:4px}
  .sim-broken-label{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em}
  .sim-broken-item{font-family:var(--font-m);font-size:10px;color:var(--text);padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:7px;align-items:center}
  .sim-broken-item:last-child{border-bottom:none}

  /* AGENTS */
  .agent-item{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:12px;transition:background .12s}
  .agent-item:hover{background:rgba(255,255,255,0.02)}
  .agent-item:last-child{border-bottom:none}
  .agent-icon{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
  .agent-body{flex:1}
  .agent-name{font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px}
  .agent-task{font-family:var(--font-m);font-size:10px;color:var(--muted);line-height:1.4}
  .agent-status{font-family:var(--font-m);font-size:9px;padding:2px 7px;border-radius:3px;margin-left:auto;flex-shrink:0;margin-top:2px;letter-spacing:0.05em}
  @keyframes agentPulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .agent-active{animation:agentPulse 2s ease infinite}
  .agent-progress{height:2px;background:var(--bg3);border-radius:1px;margin-top:8px;overflow:hidden}
  .agent-progress-fill{height:100%;border-radius:1px;transition:width 2s ease}

  /* AI CHAT */
  .chat-body{display:flex;flex-direction:column;height:400px}
  .chat-messages{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px}
  .chat-msg{max-width:85%;padding:10px 13px;border-radius:8px;font-size:12px;line-height:1.6}
  .chat-msg.user{background:var(--orange-dim);border:1px solid rgba(232,84,26,0.2);color:var(--text);align-self:flex-end;border-radius:8px 8px 2px 8px}
  .chat-msg.ai{background:var(--bg2);border:1px solid var(--border);color:var(--text);align-self:flex-start;border-radius:8px 8px 8px 2px}
  .chat-msg.ai .msg-label{font-family:var(--font-m);font-size:8px;color:var(--orange);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px}
  .chat-input-row{padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px}
  .chat-input{flex:1;background:var(--bg2);border:1px solid var(--border2);color:var(--text);font-family:var(--font-d);font-size:12px;padding:9px 12px;border-radius:6px;outline:none}
  .chat-input:focus{border-color:var(--orange)}
  .chat-send{background:var(--orange);color:#fff;border:none;border-radius:6px;padding:9px 14px;font-family:var(--font-d);font-size:12px;font-weight:600;cursor:pointer;transition:background .15s}
  .chat-send:hover{background:var(--orange-light)}
  .chat-suggestion{font-family:var(--font-m);font-size:9px;padding:4px 10px;border-radius:4px;background:var(--bg2);border:1px solid var(--border2);color:var(--muted);cursor:pointer;transition:all .12s;white-space:nowrap}
  .chat-suggestion:hover{border-color:var(--orange);color:var(--orange)}

  /* COMPANY PROFILE */
  .profile-body{padding:16px}
  .profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .profile-field{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:12px}
  .profile-field-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}
  .profile-field-val{font-size:13px;font-weight:600;color:var(--text)}
  .profile-field-sub{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-top:2px}
  .profile-save{background:var(--orange);color:#fff;border:none;border-radius:5px;padding:8px 18px;font-family:var(--font-d);font-size:12px;font-weight:600;cursor:pointer;transition:background .15s}
  .profile-save:hover{background:var(--orange-light)}

  /* TOAST */
  .toast-container{position:fixed;top:16px;right:16px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .toast{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:12px 16px;min-width:280px;display:flex;gap:10px;align-items:flex-start;pointer-events:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:toastIn .3s ease}
  @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  .toast-icon{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
  .toast-title{font-size:12px;font-weight:600;color:var(--text);margin-bottom:2px}
  .toast-sub{font-family:var(--font-m);font-size:9px;color:var(--muted)}
  .toast-dismiss{margin-left:auto;background:none;border:none;color:var(--subtle);cursor:pointer;font-size:14px;line-height:1}
  .toast-dismiss:hover{color:var(--text)}

  /* SCORE EXPLANATION */
  .score-explain{background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:14px 16px;margin:14px 16px}
  .score-explain-title{font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px}
  .score-reason{display:flex;gap:9px;padding:6px 0;border-bottom:1px solid var(--border)}
  .score-reason:last-child{border-bottom:none}
  .score-reason-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:5px}
  .score-reason-text{font-family:var(--font-m);font-size:10px;color:var(--muted);line-height:1.5}
  .score-reason-text strong{color:var(--text);font-weight:500}

  /* SOC2 GAUGE */
  .comply-grid{display:grid;grid-template-columns:260px 1fr 1fr;gap:14px}
  .comply-gauge-card{background:var(--bg1);border:1px solid var(--border);border-radius:8px;padding:18px 16px;display:flex;flex-direction:column;align-items:center}
  .gauge-wrap{position:relative;width:150px;height:150px;margin:8px 0 12px}
  .gauge-pct{font-family:var(--font-m);font-size:32px;font-weight:300;letter-spacing:-0.04em;color:var(--green);line-height:1}
  .gauge-sub{font-family:var(--font-m);font-size:9px;color:var(--muted);margin-top:3px}
  .gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .gauge-tiers{width:100%;display:flex;flex-direction:column;gap:7px;margin-top:10px}
  .gauge-tier-row{display:flex;align-items:center;gap:8px}
  .gauge-tier-bar{flex:1;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden}
  .gauge-tier-fill{height:100%;border-radius:2px}
  .gauge-tier-label{font-family:var(--font-m);font-size:9px;color:var(--muted);width:80px}
  .gauge-tier-val{font-family:var(--font-m);font-size:9px;width:24px;text-align:right}
  .comply-card{background:var(--bg1);border:1px solid var(--border);border-radius:8px;overflow:hidden}
  .comply-card-header{padding:13px 16px 11px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
  .comply-card-body{padding:10px 16px}
  .gap-item{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;margin:0 -16px;padding-left:16px;padding-right:16px}
  .gap-item:hover{background:rgba(255,255,255,0.02)}
  .gap-item:last-child{border-bottom:none}
  .gap-sev{font-family:var(--font-m);font-size:8px;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px;letter-spacing:0.08em;font-weight:500}
  .gap-sev-crit{background:var(--red-dim);color:var(--red);border:1px solid rgba(226,75,74,0.25)}
  .gap-sev-high{background:var(--yellow-dim);color:var(--yellow);border:1px solid rgba(232,184,64,0.25)}
  .gap-sev-med{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(59,139,235,0.25)}
  .gap-title{font-size:12px;font-weight:600;color:var(--text)}
  .gap-desc{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-top:2px}
  .gap-fix{margin-left:auto;font-family:var(--font-m);font-size:9px;padding:3px 9px;border-radius:4px;background:var(--orange-dim);color:var(--orange);border:1px solid rgba(232,84,26,0.3);cursor:pointer;flex-shrink:0;transition:all .12s}
  .gap-fix:hover{background:var(--orange);color:#fff}

  /* FORMS / STATES (added for live data) */
  .form-body{padding:16px;display:grid;gap:12px}
  .form-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .field-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;display:block}
  .field-input,.field-area{width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--font-d);font-size:12px;padding:8px 10px;border-radius:5px;outline:none}
  .field-area{font-family:var(--font-m);font-size:11px;line-height:1.6;resize:vertical;min-height:110px}
  .field-input:focus,.field-area:focus{border-color:var(--orange)}
  .field-hint{font-family:var(--font-m);font-size:9px;color:var(--subtle);margin-top:4px}
  .btn-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .btn-primary{background:var(--orange);color:#fff;border:none;border-radius:5px;padding:9px 18px;font-family:var(--font-d);font-size:12px;font-weight:600;cursor:pointer;transition:background .15s}
  .btn-primary:hover{background:var(--orange-light)}
  .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
  .error-banner{background:var(--red-dim);border:1px solid rgba(226,75,74,0.3);color:var(--red);border-radius:6px;padding:10px 12px;font-family:var(--font-m);font-size:11px;line-height:1.5;display:flex;gap:10px;align-items:flex-start}
  .error-banner button{margin-left:auto;background:none;border:1px solid rgba(226,75,74,0.4);color:var(--red);border-radius:4px;padding:2px 8px;font-family:var(--font-m);font-size:10px;cursor:pointer;flex-shrink:0}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:44px 20px;color:var(--subtle);text-align:center}
  .empty-state .es-icon{font-size:30px}
  .empty-state .es-text{font-family:var(--font-m);font-size:11px;color:var(--muted);max-width:420px;line-height:1.6}
  .gap-sev-low{background:var(--green-dim);color:var(--green);border:1px solid rgba(46,192,122,0.25)}
  .report-section{padding:12px 16px;border-bottom:1px solid var(--border)}
  .report-section:last-child{border-bottom:none}
  .report-label{font-family:var(--font-m);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px}
  .report-text{font-size:12px;line-height:1.65;color:var(--text);white-space:pre-wrap}
  .pill-muted{color:var(--muted);border-color:var(--border2);background:var(--bg3)}
  .pill-blue{color:var(--blue);border-color:rgba(59,139,235,0.3);background:var(--blue-dim)}
  .chat-msg.err{background:var(--red-dim);border:1px solid rgba(226,75,74,0.3);color:var(--red);align-self:flex-start}
`;
