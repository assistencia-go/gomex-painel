      // TEMA E SONS
      // ==============================================================================
      function aplicarTema(t) {
        state.theme = 'light';
        try { localStorage.setItem(THEME_KEY, 'light'); } catch (e) {}
        document.body.classList.add('theme-light');
        if ($('icoTheme') && $('icoTheme').querySelector('use')) {
          $('icoTheme').querySelector('use').setAttribute('href', '#i-sun');
        }
        if ($('btnThemeToggle')) {
          $('btnThemeToggle').style.display = 'none';
        }
        if ($('metaThemeColor')) $('metaThemeColor').setAttribute('content', '#1e2a78');
      }
      aplicarTema('light');

      function aplicarSom(habilitado) {
        state.sound = habilitado;
        localStorage.setItem(SOUND_KEY, habilitado ? 'active' : 'muted');
        $('icoSound').querySelector('use').setAttribute('href', habilitado ? '#i-bell' : '#i-bell-off');
        $('btnSoundToggle').setAttribute('title', habilitado ? 'Notificações Sonoras Ativadas' : 'Notificações Sonoras Mutadas');
      }
      aplicarSom(state.sound);

      $('btnSoundToggle').addEventListener('click', () => {
        abrirModalNotificacoesPush();
      });

      // Sintetizador de áudio discreto usando Web Audio API
      function tocarChimeAlerta(tipo) {
        if (!state.sound) return;
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          if (tipo === 'bad') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(360, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.35);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
          }

          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.34);
        } catch (e) { }
      }

      // ==============================================================================
      // HELPERS DE FORMATAÇÃO E HIGIENIZAÇÃO
      // ==============================================================================
      const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const isoLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const formatarData = iso => {
        if (!iso) return '—';
        const clean = String(iso).split('T')[0];
        const p = clean.split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
      };
      const fmtKm = n => {
        if (n === null || n === undefined || n === '') return '—';
        const cleanNum = typeof n === 'number' ? n : Number(String(n).replace(/\./g, '').replace(/\D/g, ''));
        return !isNaN(cleanNum) ? cleanNum.toLocaleString('pt-BR') + ' km' : '—';
      };
      const icon = name => '<svg class="i"><use href="#i-' + name + '"/></svg>';
      const avariasOf = it => Array.isArray(it.avarias) ? it.avarias : [];
      const pneusOf = it => Array.isArray(it.pneus) ? it.pneus : [];
      const itensOf = it => Array.isArray(it.itens) ? it.itens : [];
      const nokOf = it => itensOf(it).filter(x => x && x.valor === 'NOK');
      const pneuAlert = it => it.pneu_dano === 'Sim' || pneusOf(it).some(p => p.estado === 'Gasto');

      function statusTag(raw, statusItem) {
        if (statusItem === 'inativo') {
          return '<span class="tag tag-inativo"><i class="dot" style="background:#94a3b8"></i>Inativa</span>';
        }
        const s = STATUS[raw] || { label: raw || 'Pendente', cls: 'tag-neutral' };
        return '<span class="tag ' + s.cls + '"><i class="dot"></i>' + esc(s.label) + '</span>';
      }

      function tipoBadge(tipo) {
        const t = (tipo || 'Saída').trim();
        if (t === 'Retorno') return '<span class="badge-tipo tipo-retorno">Retorno</span>';
        if (t === 'Periódica') return '<span class="badge-tipo tipo-periodica">Periódica</span>';
        return '<span class="badge-tipo tipo-saida">Saída</span>';
      }

      let toastTimer = null;
      function toast(msg, kind) {
        const isErr = kind === 'error' || kind === 'bad';
        const el = $('toast');
        el.className = 'toast show' + (isErr ? ' error' : '');
        el.innerHTML = icon(isErr ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
      }

      // ==============================================================================
      // MODAL GLOBAL DE CONFIRMAÇÃO EXECUTIVA (SEM POP-UPS NATIVOS DO NAVEGADOR)
      // ==============================================================================
      let resolverConfirmacaoGlobal = null;

      function abrirConfirmacaoGlobal({
        titulo = 'Confirmação',
        subtitulo = 'Confirmação de segurança',
        mensagem = 'Deseja realmente continuar com esta ação?',
        aviso = 'Esta operação não poderá ser desfeita.',
        textoConfirmar = 'Confirmar',
        textoCancelar = 'Cancelar',
        variante = 'perigo', // 'perigo' | 'alerta' | 'padrao'
        icone = 'trash'
      } = {}) {
        return new Promise((resolve) => {
          resolverConfirmacaoGlobal = resolve;
          const modal = $('modalConfirmacaoGlobal');
          if (!modal) {
            resolve(true);
            return;
          }

          if ($('modalConfirmacaoGlobalTitulo')) $('modalConfirmacaoGlobalTitulo').textContent = titulo;
          if ($('modalConfirmacaoGlobalSubtitulo')) $('modalConfirmacaoGlobalSubtitulo').textContent = subtitulo;
          if ($('modalConfirmacaoGlobalTexto')) $('modalConfirmacaoGlobalTexto').innerHTML = mensagem;

          const elAviso = $('modalConfirmacaoGlobalAviso');
          if (elAviso) {
            if (aviso) {
              elAviso.style.display = 'block';
              elAviso.innerHTML = aviso;
            } else {
              elAviso.style.display = 'none';
            }
          }

          const txtBtn = $('modalConfirmacaoGlobalBtnTexto');
          if (txtBtn) txtBtn.textContent = textoConfirmar;

          const btnCancelar = $('btnModalConfirmacaoGlobalCancelar');
          if (btnCancelar) btnCancelar.textContent = textoCancelar;

          const icoId = icone.startsWith('i-') ? icone : ('i-' + icone);
          if ($('modalConfirmacaoGlobalIcoUse')) $('modalConfirmacaoGlobalIcoUse').setAttribute('href', '#' + icoId);
          if ($('modalConfirmacaoGlobalBtnIcoUse')) $('modalConfirmacaoGlobalBtnIcoUse').setAttribute('href', '#' + icoId);

          const icoWrapper = $('modalConfirmacaoGlobalIcoWrapper');
          const btnConfirmar = $('btnModalConfirmacaoGlobalConfirmar');

          if (variante === 'perigo') {
            if (icoWrapper) {
              icoWrapper.style.background = 'rgba(250, 138, 138, 0.15)';
              icoWrapper.style.color = 'var(--bad)';
            }
            if (btnConfirmar) {
              btnConfirmar.style.background = '#dc2626';
              btnConfirmar.style.borderColor = '#b91c1c';
              btnConfirmar.style.color = '#ffffff';
            }
          } else if (variante === 'alerta') {
            if (icoWrapper) {
              icoWrapper.style.background = 'rgba(254, 240, 138, 0.2)';
              icoWrapper.style.color = 'var(--warn)';
            }
            if (btnConfirmar) {
              btnConfirmar.style.background = '#d97706';
              btnConfirmar.style.borderColor = '#b45309';
              btnConfirmar.style.color = '#ffffff';
            }
          } else {
            if (icoWrapper) {
              icoWrapper.style.background = 'rgba(99, 102, 241, 0.15)';
              icoWrapper.style.color = 'var(--accent-hi)';
            }
            if (btnConfirmar) {
              btnConfirmar.style.background = 'var(--accent-hi)';
              btnConfirmar.style.borderColor = 'var(--accent-hi)';
              btnConfirmar.style.color = '#ffffff';
            }
          }

          modal.classList.add('open');
        });
      }
      window.abrirConfirmacaoGlobal = abrirConfirmacaoGlobal;

      function responderConfirmacaoGlobal(resultado) {
        const modal = $('modalConfirmacaoGlobal');
        if (modal) modal.classList.remove('open');
        if (typeof resolverConfirmacaoGlobal === 'function') {
          const fn = resolverConfirmacaoGlobal;
          resolverConfirmacaoGlobal = null;
          fn(Boolean(resultado));
        }
      }
      window.responderConfirmacaoGlobal = responderConfirmacaoGlobal;

      // Atalho de clique fora do modal e tecla ESC
      document.addEventListener('click', e => {
        const modal = $('modalConfirmacaoGlobal');
        if (modal && modal.classList.contains('open') && e.target === modal) {
          responderConfirmacaoGlobal(false);
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && $('modalConfirmacaoGlobal')?.classList.contains('open')) {
          responderConfirmacaoGlobal(false);
        }
      });

      // ==============================================================================