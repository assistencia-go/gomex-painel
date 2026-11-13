      // ANIMAÇÃO DE PALAVRAS DINÂMICAS NA TELA DE LOGIN
      // ==============================================================================
      const ROTATING_WORDS = ['organiza', 'protege', 'aprimora', 'padroniza', 'fortalece', 'economiza'];
      let wordIdx = 0;
      const wordRotator = $('wordRotator');

      if (wordRotator) {
        setInterval(() => {
          wordRotator.classList.add('word-exit');
          setTimeout(() => {
            wordIdx = (wordIdx + 1) % ROTATING_WORDS.length;
            wordRotator.textContent = ROTATING_WORDS[wordIdx];
            wordRotator.classList.remove('word-exit');
            wordRotator.classList.add('word-enter');
            requestAnimationFrame(() => {
              setTimeout(() => {
                wordRotator.classList.remove('word-enter');
              }, 40);
            });
          }, 380);
        }, 2400);
      }

      // Atalho direto de acesso ao Check-list do motorista
      if (window.location.pathname === '/checklist' || window.location.pathname === '/check-list') {
        window.location.href = 'https://gomex-checklist.gomexassistencia2026.workers.dev/';
        return;
      }

      // ==============================================================================
      // INICIALIZAÇÃO E SANITIZAÇÃO DA BARRA DE ENDEREÇOS
      // ==============================================================================
      if (window.location.search) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const uUrl = urlParams.get('username') || urlParams.get('user');
          const pUrl = urlParams.get('password') || urlParams.get('pass');
          // Remove imediatamente as credenciais da barra de endereço para não exibir ao usuário
          window.history.replaceState({}, document.title, window.location.pathname);

          // Limpeza imediata de parâmetros sem armazenar senhas na URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) { }
      }

      // ==============================================================================
      // NOTIFICAÇÕES WEB PUSH (PERMANENTES & NATIVAS)
      // ==============================================================================
      const VAPID_PUBLIC_KEY = 'BNC0C6aRpTSIkY76KeYB_x7VTA52qvjRrV6nAoeHHpZHgC6chgFIA2SCL-ZklO2bJ4egYC8yydWvV-ypBZW9Qfc';

      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      function abrirModalNotificacoesPush() {
        const m = $('modalNotificacoesPush');
        if (!m) return;
        m.classList.add('open');
        atualizarStatusPushUi();
      }
      window.abrirModalNotificacoesPush = abrirModalNotificacoesPush;

      function fecharModalNotificacoesPush() {
        const m = $('modalNotificacoesPush');
        if (m) m.classList.remove('open');
      }
      window.fecharModalNotificacoesPush = fecharModalNotificacoesPush;

      function alternarSomPeloModal() {
        aplicarSom(!state.sound);
        atualizarStatusPushUi();
        toast(state.sound ? 'Sons de notificação ativados' : 'Sons de notificação mutados');
      }
      window.alternarSomPeloModal = alternarSomPeloModal;

      async function atualizarStatusPushUi() {
        const elPerm = $('pushStatusPermissao');
        const elInsc = $('pushStatusInscricao');
        const btnAtivar = $('btnAtivarPushModal');
        const lblBtn = $('lblBtnAtivarPush');
        const btnSom = $('btnToggleSomModal');

        if (btnSom) {
          btnSom.textContent = state.sound ? 'Mutar Sons' : 'Ativar Sons';
          btnSom.style.color = state.sound ? 'var(--ok)' : 'var(--bad)';
        }

        if (!('Notification' in window)) {
          if (elPerm) elPerm.textContent = 'Não suportado';
          if (elInsc) elInsc.textContent = 'Indisponível';
          if (btnAtivar) btnAtivar.disabled = true;
          return;
        }

        const perm = Notification.permission;
        if (elPerm) {
          if (perm === 'granted') {
            elPerm.textContent = 'Concedida';
            elPerm.style.color = 'var(--ok)';
          } else if (perm === 'denied') {
            elPerm.textContent = 'Bloqueada';
            elPerm.style.color = 'var(--bad)';
          } else {
            elPerm.textContent = 'Pendente';
            elPerm.style.color = 'var(--ink-2)';
          }
        }

        let isSubscribed = false;
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) isSubscribed = true;
          }
        } catch (e) { }

        if (elInsc) {
          if (isSubscribed) {
            elInsc.textContent = 'Inscrito e Ativo';
            elInsc.style.color = 'var(--ok)';
          } else {
            elInsc.textContent = 'Não Inscrito';
            elInsc.style.color = 'var(--ink-2)';
          }
        }

        if (btnAtivar && lblBtn) {
          if (perm === 'granted' && isSubscribed) {
            lblBtn.textContent = 'Notificações Já Ativadas no Aparelho';
            btnAtivar.disabled = true;
            btnAtivar.style.opacity = '0.7';
          } else {
            lblBtn.textContent = 'Ativar Notificações no Aparelho';
            btnAtivar.disabled = false;
            btnAtivar.style.opacity = '1';
          }
        }
      }
      window.atualizarStatusPushUi = atualizarStatusPushUi;

      async function acionarAtivacaoPush() {
        try {
          if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            toast('Notificações não suportadas neste navegador.', 'error');
            return;
          }

          toast('Solicitando permissão de notificação...');
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            atualizarStatusPushUi();
            toast('Permissão de notificação negada pelo usuário.', 'error');
            return;
          }

          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appServerKey
            });
          }

          // Envia subscription para o servidor
          await fetch('/api/push-subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: sub,
              userAgent: navigator.userAgent || '',
              deviceName: navigator.userAgentData && navigator.userAgentData.platform ? navigator.userAgentData.platform : 'Aparelho'
            })
          });

          localStorage.setItem('gomex_push_subscribed', 'true');
          localStorage.removeItem('dispensa_banner_push');
          atualizarStatusPushUi();
          dispensarBannerPush(false);
          toast('Aparelho conectado! Notificações push ativadas com sucesso.');
        } catch (err) {
          console.error('Erro ao ativar push:', err);
          toast('Erro ao ativar notificações: ' + (err.message || err), 'error');
        }
      }
      window.acionarAtivacaoPush = acionarAtivacaoPush;

      async function enviarNotificacaoTeste() {
        try {
          toast('Disparando notificação de teste...');
          const resp = await fetch('/api/push-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Gomex Frota',
              body: 'Teste de notificação recebido com sucesso no seu aparelho!',
              url: '/'
            })
          });
          const data = await resp.json().catch(() => ({}));
          if (data && data.ok) {
            toast('Notificação enviada! Verifique a barra de notificações do seu aparelho.');
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Gomex Frota', {
                body: 'Teste de notificação recebido com sucesso no seu aparelho!',
                icon: '/icon.svg'
              });
              toast('Notificação exibida no aparelho.');
            } else {
              toast('Permissão necessária para exibir notificações.', 'error');
            }
          }
        } catch (err) {
          console.error('Erro no envio de teste:', err);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Gomex Frota', {
              body: 'Teste de notificação recebido com sucesso no seu aparelho!',
              icon: '/icon.svg'
            });
            toast('Notificação exibida no dispositivo.');
          } else {
            toast('Erro ao disparar teste: ' + (err.message || err), 'error');
          }
        }
      }
      window.enviarNotificacaoTeste = enviarNotificacaoTeste;

      function dispararNotificacaoNativa(vistoria, totalNovas) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
          const titulo = totalNovas > 1 
            ? totalNovas + ' Novas Vistorias Recebidas'
            : 'Nova Vistoria Nº ' + (vistoria.numero || '') + ' - Placa ' + (vistoria.placa || '');
          const corpo = (vistoria.motorista ? 'Motorista: ' + vistoria.motorista + '\n' : '') +
                        (vistoria.liberacao ? 'Status: ' + vistoria.liberacao : 'Check-list finalizado');
          
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(titulo, {
                body: corpo,
                icon: '/icon.svg',
                badge: '/icon.svg',
                tag: 'nova-vistoria-' + (vistoria.id || Date.now()),
                data: { url: '/' }
              });
            });
          } else {
            new Notification(titulo, {
              body: corpo,
              icon: '/icon.svg'
            });
          }
        } catch (e) {
          console.warn('Erro notificacao nativa:', e);
        }
      }
      window.dispararNotificacaoNativa = dispararNotificacaoNativa;

      async function notificarServidorNovaVistoria(vistoria, totalNovas) {
        try {
          const titulo = totalNovas > 1 
            ? totalNovas + ' Novas Vistorias Recebidas'
            : 'Nova Vistoria Nº ' + (vistoria.numero || '') + ' (' + (vistoria.placa || '') + ')';
          const corpo = (vistoria.motorista ? 'Motorista: ' + vistoria.motorista + ' | ' : '') +
                        'Status: ' + (vistoria.liberacao || 'Pendente');
          await fetch('/api/push-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: titulo,
              body: corpo,
              url: '/'
            })
          });
        } catch (err) {
          console.warn('Erro ao notificar servidor sobre nova vistoria:', err);
        }
      }
      window.notificarServidorNovaVistoria = notificarServidorNovaVistoria;

      function dispensarBannerPush(salvar = true) {
        const b = $('bannerAtivarPush');
        if (b) b.style.display = 'none';
        if (salvar) localStorage.setItem('dispensa_banner_push', String(Date.now()));
      }
      window.dispensarBannerPush = dispensarBannerPush;

      function checarExibicaoBannerPush() {
        const b = $('bannerAtivarPush');
        if (!b) return;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
          b.style.display = 'none';
          return;
        }
        const disp = localStorage.getItem('dispensa_banner_push');
        if (disp && (Date.now() - Number(disp)) < (3 * 24 * 60 * 60 * 1000)) {
          b.style.display = 'none';
          return;
        }
        b.style.display = 'flex';
      }
      window.checarExibicaoBannerPush = checarExibicaoBannerPush;

      // ==============================================================================
      // INSTALAÇÃO DO APLICATIVO NO APARELHO & SERVICE WORKER
      // ==============================================================================
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => {
              try { reg.update(); } catch (e) {}
              console.log('[App] ServiceWorker registrado com sucesso:', reg.scope);
              checarExibicaoBannerPush();
              atualizarStatusPushUi();
            })
            .catch(err => {
              console.warn('[App] ServiceWorker falhou ao registrar:', err);
            });

          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        });
      }

      let deferredPwaPrompt = null;
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const btn = $('btnPwaInstall');
        if (btn) {
          btn.hidden = false;
          btn.onclick = async () => {
            btn.hidden = true;
            if (deferredPwaPrompt) {
              deferredPwaPrompt.prompt();
              const { outcome } = await deferredPwaPrompt.userChoice;
              console.log('[App] Escolha:', outcome);
              deferredPwaPrompt = null;
            }
          };
        }
      });

      window.addEventListener('appinstalled', () => {
        const btn = $('btnPwaInstall');
        if (btn) btn.hidden = true;
        console.log('[App] Aplicativo instalado!');
      });
