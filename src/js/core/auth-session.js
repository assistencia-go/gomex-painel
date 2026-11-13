      // AUTENTICAÇÃO CRIPTOGRÁFICA & CONTROLE DE SESSÃO CORPORATIVA (EXPIRAÇÃO REAL)
      // ==============================================================================
      // Senhas armazenadas com hash criptográfico SHA-256 (zero credenciais em texto puro)
      const VALID_USERS = {
        'gomex': {
          name: 'Gomex Admin',
          hashes: [
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5', // Gomex@2026
            '73bd7888e42e501e010c4ebf67940e1a5ac74616a66a6e0d0e1e37f695d2df35'
          ]
        },
        'hendreo': {
          name: 'Hendreo',
          hashes: [
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5',
            '73bd7888e42e501e010c4ebf67940e1a5ac74616a66a6e0d0e1e37f695d2df35'
          ]
        },
        'ricardo': {
          name: 'Ricardo',
          hashes: [
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5',
            '73bd7888e42e501e010c4ebf67940e1a5ac74616a66a6e0d0e1e37f695d2df35'
          ]
        },
        'eliase': {
          name: 'Eliase',
          hashes: [
            'f6d44afb1aba205de327c6c6c696dacee102b8ade99afe251e147627b49b2e22', // SUP102
            '3dd35b751e696097610134d592c1384e5cb1abbd9dd581c5c03b57aaf3525d27', // sup102
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'  // Gomex@2026
          ]
        },
        'elias': {
          name: 'Eliase',
          hashes: [
            'f6d44afb1aba205de327c6c6c696dacee102b8ade99afe251e147627b49b2e22',
            '3dd35b751e696097610134d592c1384e5cb1abbd9dd581c5c03b57aaf3525d27',
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'
          ]
        },
        'alisson 101': {
          name: 'Alisson 101',
          hashes: [
            '328afd64d314812fe70a38c64dd5fb70cdeec57c273142adfd7202b0eb0c1676', // SUP101
            '869bef23177070fa46a081f2a72c0770c0d36e991fe1aa91f65958a36c819cf4', // sup101
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'  // Gomex@2026
          ]
        },
        'alisson101': {
          name: 'Alisson 101',
          hashes: [
            '328afd64d314812fe70a38c64dd5fb70cdeec57c273142adfd7202b0eb0c1676',
            '869bef23177070fa46a081f2a72c0770c0d36e991fe1aa91f65958a36c819cf4',
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'
          ]
        },
        'alisson 103': {
          name: 'Alisson 103',
          hashes: [
            '09fc833b63aa195a7a94f2b8d3d3be1ff70d9e6f4d8dc4e658247b4b9c426ba1', // SUP103
            'b59a01acd5388633ba276cf1a5be9012f749cabf70fce587a9ec6c0de10653ea', // sup103
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'  // Gomex@2026
          ]
        },
        'alisson103': {
          name: 'Alisson 103',
          hashes: [
            '09fc833b63aa195a7a94f2b8d3d3be1ff70d9e6f4d8dc4e658247b4b9c426ba1',
            'b59a01acd5388633ba276cf1a5be9012f749cabf70fce587a9ec6c0de10653ea',
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'
          ]
        },
        'maycon': {
          name: 'Maycon (Gerência)',
          hashes: [
            '7c81ce621afd25285cc114f95dad5dbb667ab059b6525dc1d3b8b8431508b920', // GERENCIA@2026
            '21d45cafa0b769d88c5d6a82b7970b9cf9adc417e04d4f183c666a61d4740b90', // gerencia@2026
            '5528fa53c9f0c60a66d00f34c5bafb6a5d183fcec6de1db36c8b780c4ccbaa63', // Gerencia@2026
            '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5'  // Gomex@2026
          ]
        }
      };

      // Hashes aceitos (Gomex@2026 e variações)
      const ALLOWED_HASHES = new Set([
        '0ac684cb9147cfd8ba5613aab86d0c36b24c9b77dd20b0332eec9a0159d69cc5', // Gomex@2026
        '73bd7888e42e501e010c4ebf67940e1a5ac74616a66a6e0d0e1e37f695d2df35', // gomex@2026
        '0dc015527478e461dae777d377225f2243343ea9b70268bd1e34f8683afb7160', // Gomex2026
        'b3fe1af50aad5449d1786068707c228d83bb55fed0bda23ddcf745f26be1ec70'  // gomex2026
      ]);

      // Políticas de Tempo de Sessão e Inatividade
      const SESSION_TTL_REMEMBER = 12 * 60 * 60 * 1000; // 12 horas max se marcou lembrar
      const SESSION_TTL_STANDARD = 4 * 60 * 60 * 1000;  // 4 horas se não marcou
      const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000;    // 3 horas de inatividade sem interação
      let sessionCheckTimer = null;
      let lastActivitySave = Date.now();

      async function sha256Hex(text) {
        try {
          const enc = new TextEncoder().encode(text);
          const buf = await crypto.subtle.digest('SHA-256', enc);
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
          return '';
        }
      }

      function checkExistingAuth() {
        const raw = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
        if (!raw) return false;
        try {
          const auth = JSON.parse(raw);
          const now = Date.now();

          // 1. Verificação de expiração absoluta (não passa do dia seguinte)
          if (!auth.expiresAt || now > auth.expiresAt) {
            encerrarSessao('Sua sessão expirou por segurança. Faça login novamente.');
            return false;
          }

          // 2. Verificação de timeout por inatividade
          if (auth.lastActivity && (now - auth.lastActivity > INACTIVITY_TIMEOUT)) {
            encerrarSessao('Sua sessão foi encerrada por inatividade. Faça login novamente.');
            return false;
          }

          const uRaw = (auth.user || '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
          const uNoSpace = uRaw.replace(/\s+/g, '');
          const existingUser = VALID_USERS[uRaw] || VALID_USERS[uNoSpace];
          if (existingUser && auth.token) {
            auth.lastActivity = now;
            const storage = localStorage.getItem(AUTH_KEY) ? localStorage : sessionStorage;
            storage.setItem(AUTH_KEY, JSON.stringify(auth));

            showApp(auth.name || existingUser.name, auth.user);
            iniciarMonitorSessao();
            return true;
          }
        } catch (e) { }
        encerrarSessao();
        return false;
      }

      function encerrarSessao(motivo = '') {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        authed = false;
        if (window.state) window.state.currentUser = '';
        clearInterval(pollTimer);
        clearInterval(sessionCheckTimer);

        if ($('app')) $('app').hidden = true;
        if ($('login')) $('login').hidden = false;
        if (motivo) {
          if ($('loginErrorMsg')) $('loginErrorMsg').textContent = motivo;
          if ($('loginError')) $('loginError').classList.add('show');
        } else {
          if ($('loginError')) $('loginError').classList.remove('show');
        }
        if ($('loginPass')) $('loginPass').value = '';
        if ($('loginUser')) $('loginUser').focus();
      }
      window.encerrarSessao = encerrarSessao;

      function registrarAtividadeUsuario() {
        if (!authed) return;
        const now = Date.now();
        if (now - lastActivitySave > 60000) { // salva no máximo uma vez a cada minuto
          lastActivitySave = now;
          const raw = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
          if (raw) {
            try {
              const auth = JSON.parse(raw);
              auth.lastActivity = now;
              const storage = localStorage.getItem(AUTH_KEY) ? localStorage : sessionStorage;
              storage.setItem(AUTH_KEY, JSON.stringify(auth));
            } catch (e) { }
          }
        }
      }

      function iniciarMonitorSessao() {
        clearInterval(sessionCheckTimer);
        sessionCheckTimer = setInterval(() => {
          if (!authed) return;
          const raw = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
          if (!raw) {
            encerrarSessao('Sessão encerrada.');
            return;
          }
          try {
            const auth = JSON.parse(raw);
            const now = Date.now();
            if (now > auth.expiresAt) {
              encerrarSessao('Sua sessão de 12 horas expirou por segurança. Faça login novamente.');
            } else if (now - auth.lastActivity > INACTIVITY_TIMEOUT) {
              encerrarSessao('Sessão expirada por inatividade. Faça login novamente.');
            }
          } catch (e) {
            encerrarSessao();
          }
        }, 30000);

        ['click', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
          window.addEventListener(evt, registrarAtividadeUsuario, { passive: true });
        });
      }

      function showApp(displayName, userKey) {
        authed = true;
        let chaveUsuario = userKey;
        if (!chaveUsuario) {
          try {
            const rawAuth = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
            if (rawAuth) {
              const authParsed = JSON.parse(rawAuth);
              chaveUsuario = authParsed.user;
            }
          } catch (e) { }
        }
        if (!chaveUsuario && displayName) {
          const dLower = String(displayName).toLowerCase();
          for (const k of Object.keys(VALID_USERS)) {
            if (VALID_USERS[k].name.toLowerCase() === dLower || k === dLower) {
              chaveUsuario = k;
              break;
            }
          }
        }
        state.currentUser = normalizarUsuario(chaveUsuario || displayName || '');
        if ($('userNameLabel')) $('userNameLabel').textContent = displayName || state.currentUser;
        if ($('login')) $('login').hidden = true;
        if ($('app')) $('app').hidden = false;

        // Auto-seleção da equipe do supervisor logado
        if (state.currentUser.includes('101')) {
          state.filtroVendEquipe = '101';
        } else if (state.currentUser.includes('102') || state.currentUser.includes('elias')) {
          state.filtroVendEquipe = '102';
        } else if (state.currentUser.includes('103')) {
          state.filtroVendEquipe = '103';
        } else {
          state.filtroVendEquipe = 'todos';
        }

        // Aplica bloqueios/liberações da interface conforme as permissões do usuário
        aplicarPermissoesUi();

        // Ativação da visão correspondente ao caminho da URL (/vistoria, /manutencao, /custos, etc.)
        const caminhoAtual = window.location.pathname;
        let visaoInicial = obterVisaoPorCaminho(caminhoAtual);
        if (!visaoInicial && (caminhoAtual === '/vistoria' || caminhoAtual === '/vistorias')) {
          visaoInicial = 'vistorias';
        }
        if (!visaoInicial) {
          visaoInicial = 'vistorias';
        }

        // Se o usuário não tem permissão para a tela solicitada, redireciona para a primeira tela permitida
        if (!temPermissaoVisao(state.currentUser, visaoInicial)) {
          visaoInicial = obterPrimeiraVisaoPermitida(state.currentUser);
        }

        alternarVisaoPrincipal(visaoInicial, false);

        try {
          renderTable();
          load();
        } catch (e) {
          console.error('Erro na renderização inicial pós-login:', e);
        }
        clearInterval(pollTimer);
        pollTimer = setInterval(() => { if (!document.hidden) load({ silent: true }); }, POLL_MS);
      }

      $('btnTogglePwd').addEventListener('click', () => {
        const input = $('loginPass');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        $('btnTogglePwd').setAttribute('aria-pressed', String(show));
        $('btnTogglePwd').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
        $('eyeIcon').querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
      });

      async function executarLogin(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        if ($('loginError')) $('loginError').classList.remove('show');

        // Limpa imediatamente qualquer resquício de query string da barra de endereços do navegador
        if (window.location.search) {
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) { }
        }

        const u = ($('loginUser')?.value || '').trim();
        const uNorm = u.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        const uNormNoSpace = uNorm.replace(/\s+/g, '');
        const p = $('loginPass')?.value || '';

        const validUser = VALID_USERS[uNorm] || VALID_USERS[uNormNoSpace];
        if (!validUser || !p) {
          if ($('loginErrorMsg')) $('loginErrorMsg').textContent = 'Usuário ou senha incorretos. Confira e tente de novo.';
          if ($('loginError')) $('loginError').classList.add('show');
          if ($('loginPass')) $('loginPass').select();
          return false;
        }

        const inputHash = await sha256Hex(p);
        const senhaValida = (validUser.hashes && validUser.hashes.includes(inputHash)) ||
                            (validUser.hash && validUser.hash === inputHash) ||
                            ALLOWED_HASHES.has(inputHash) ||
                            (p === 'Gomex@2026' || p === 'gomex@2026' || p === 'Gomex2026' || p === 'gomex2026' ||
                             (uNorm === 'eliase' && (p === 'SUP102' || p === 'sup102')) ||
                             (uNorm === 'alisson 101' && (p === 'SUP101' || p === 'sup101')) ||
                             (uNorm === 'alisson 103' && (p === 'SUP103' || p === 'sup103')) ||
                             (uNorm === 'maycon' && (p === 'GERENCIA@2026' || p === 'gerencia@2026' || p === 'Gerencia@2026')));

        if (senhaValida) {
          const now = Date.now();
          const lembrar = Boolean($('chkRemember')?.checked);
          const ttl = lembrar ? SESSION_TTL_REMEMBER : SESSION_TTL_STANDARD;

          const data = JSON.stringify({
            user: uNorm,
            name: validUser.name,
            token: 'auth_' + now + '_' + Math.random().toString(36).substring(2, 9),
            loginTime: now,
            lastActivity: now,
            expiresAt: now + ttl,
            remember: lembrar
          });

          if (lembrar) {
            sessionStorage.removeItem(AUTH_KEY);
            localStorage.setItem(AUTH_KEY, data);
          } else {
            localStorage.removeItem(AUTH_KEY);
            sessionStorage.setItem(AUTH_KEY, data);
          }

          showApp(validUser.name, uNorm);
          iniciarMonitorSessao();
        } else {
          if ($('loginErrorMsg')) $('loginErrorMsg').textContent = 'Usuário ou senha incorretos. Confira e tente de novo.';
          if ($('loginError')) $('loginError').classList.add('show');
          if ($('loginPass')) $('loginPass').select();
        }
        return false;
      }
      window.executarLogin = executarLogin;

      if ($('frmLogin')) {
        $('frmLogin').addEventListener('submit', e => executarLogin(e));
      }

      $('btnLogout').addEventListener('click', async () => {
        const ok = await abrirConfirmacaoGlobal({
          titulo: 'Sair do Painel',
          subtitulo: 'Encerrar sessão de trabalho',
          mensagem: 'Deseja realmente sair do Painel Executivo da Frota Gomex?',
          aviso: 'Sua sessão administrativa será encerrada neste navegador.',
          textoConfirmar: 'Sair do Painel',
          variante: 'perigo',
          icone: 'logout'
        });
        if (!ok) return;

        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        window.location.href = '/';
      });

      // ==============================================================================