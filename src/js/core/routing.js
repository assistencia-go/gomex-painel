      // ROTEAMENTO DINÂMICO SPA (URLs LIMPAS: /vistoria, /manutencao, /custos, etc.)
      // ==============================================================================
      const ROUTE_MAP = {
        'vistorias': '/vistoria',
        'manutencao': '/manutencao',
        'ocorrencias': '/ocorrencias',
        'agendamentos': '/agendamentos',
        'gastos': '/custos',
        'galeria': '/galeria',
        'vendedores': '/vendedores',
        'frotacad': '/frota',
        'admin': '/admin'
      };

      const ROUTE_TITLES = {
        'vistorias': 'Vistorias da frota · Gomex Frota',
        'manutencao': 'Manutenção & Oficina · Gomex Frota',
        'ocorrencias': 'Ocorrências & Pausas da Frota · Gomex Frota',
        'agendamentos': 'Agendamento de Serviços · Gomex Frota',
        'gastos': 'Custos, Peças & Insumos · Gomex Frota',
        'galeria': 'Galeria de Fotos · Gomex Frota',
        'vendedores': 'Vendedores & Custódia · Gomex Frota',
        'frotacad': 'Frota & Veículos · Gomex Frota',
        'admin': 'Gestão de Permissões · Gomex Admin'
      };

      const PATH_TO_VIEW = {
        '/': 'vistorias',
        '/vistoria': 'vistorias',
        '/vistorias': 'vistorias',
        '/manutencao': 'manutencao',
        '/manuntecao': 'manutencao',
        '/manut': 'manutencao',
        '/ocorrencias': 'ocorrencias',
        '/ocorrencia': 'ocorrencias',
        '/pausas': 'ocorrencias',
        '/pausa': 'ocorrencias',
        '/agendamentos': 'agendamentos',
        '/agendamento': 'agendamentos',
        '/servicos': 'agendamentos',
        '/servico': 'agendamentos',
        '/custos': 'gastos',
        '/pecas': 'gastos',
        '/gastos': 'gastos',
        '/custos-pecas': 'gastos',
        '/galeria': 'galeria',
        '/fotos': 'galeria',
        '/galeria-fotos': 'galeria',
        '/vendedores': 'vendedores',
        '/vendedor': 'vendedores',
        '/frota': 'frotacad',
        '/veiculos': 'frotacad',
        '/veiculo': 'frotacad',
        '/frotacad': 'frotacad',
        '/admin': 'admin',
        '/permissoes': 'admin',
        '/usuarios': 'admin'
      };

      function obterVisaoPorCaminho(caminho) {
        if (!caminho) return 'vistorias';
        const pathNorm = caminho.toLowerCase().replace(/\/+$/, '') || '/';
        return PATH_TO_VIEW[pathNorm] || 'vistorias';
      }
      window.obterVisaoPorCaminho = obterVisaoPorCaminho;

      function alternarVisaoPrincipal(visao, atualizarUrl = true) {
        if (visao === 'agendamentos') {
          filtrarOcorrencias('agendado');
          return alternarVisaoPrincipal('ocorrencias', atualizarUrl);
        }

        // BLOQUEIO DE SEGURANÇA E CONTROLE DE PERMISSÕES
        if (visao === 'admin') {
          if (!isGomexAdmin()) {
            mostrarNotificacaoAcessoBloqueado('admin');
            const fallback = obterPrimeiraVisaoPermitida(state.currentUser);
            return alternarVisaoPrincipal(fallback, true);
          }
        } else if (!isGomexAdmin() && !temPermissaoVisao(state.currentUser, visao)) {
          mostrarNotificacaoAcessoBloqueado(visao);
          const fallback = obterPrimeiraVisaoPermitida(state.currentUser);
          if (fallback && fallback !== visao) {
            return alternarVisaoPrincipal(fallback, true);
          }
          return;
        }

        state.visaoAtual = visao;
        const isVistorias = visao === 'vistorias';
        const isManut = visao === 'manutencao';
        const isOcorrencias = visao === 'ocorrencias';
        const isAgendamentos = visao === 'agendamentos';
        const isGastos = visao === 'gastos';
        const isGaleria = visao === 'galeria';
        const isVend = visao === 'vendedores';
        const isFrotaCad = visao === 'frotacad';
        const isAdmin = visao === 'admin';

        // Atualização da URL na barra de endereços (HTML5 History API)
        if (atualizarUrl && window.history && window.history.pushState) {
          const novoCaminho = ROUTE_MAP[visao] || '/vistoria';
          if (window.location.pathname !== novoCaminho) {
            window.history.pushState({ visao: visao }, document.title, novoCaminho);
          }
        }
        if (ROUTE_TITLES[visao]) {
          document.title = ROUTE_TITLES[visao];
        }

        const btnVist = $('btnViewVistorias');
        const btnManut = $('btnViewManut');
        const btnOcr = $('btnViewOcorrencias');
        const btnGastos = $('btnViewGastos');
        const btnGaleria = $('btnViewGaleria');
        const btnVend = $('btnViewVendedores');
        const btnFrotaCad = $('btnViewFrotaCad');
        const btnAdmin = $('btnViewAdmin');

        const secVist = $('sectionVistoriasView');
        const secManut = $('sectionManutView');
        const secOcr = $('sectionOcorrenciasView');
        const secGastos = $('sectionGastosView');
        const secGaleria = $('sectionGaleriaView');
        const secVend = $('sectionVendedoresView');
        const secFrotaCad = $('sectionFrotaCadView');
        const secAdmin = $('sectionAdminPermissoesView');

        if (btnVist) btnVist.classList.toggle('active', isVistorias);
        if (btnManut) btnManut.classList.toggle('active', isManut);
        if (btnOcr) btnOcr.classList.toggle('active', isOcorrencias);
        if (btnGastos) btnGastos.classList.toggle('active', isGastos);
        if (btnGaleria) btnGaleria.classList.toggle('active', isGaleria);
        if (btnVend) btnVend.classList.toggle('active', isVend);
        if (btnFrotaCad) btnFrotaCad.classList.toggle('active', isFrotaCad);
        if (btnAdmin) btnAdmin.classList.toggle('active', isAdmin);

        if (secVist) secVist.hidden = !isVistorias;
        if (secManut) secManut.hidden = !isManut;
        if (secOcr) secOcr.hidden = !isOcorrencias;
        if (secGastos) secGastos.hidden = !isGastos;
        if (secGaleria) secGaleria.hidden = !isGaleria;
        if (secVend) secVend.hidden = !isVend;
        if (secFrotaCad) secFrotaCad.hidden = !isFrotaCad;
        if (secAdmin) secAdmin.hidden = !isAdmin;

        const titleEl = $('pageMainTitle');
        const subEl = $('pageMainSubtitle');
        if (titleEl && subEl) {
          if (isAdmin) {
            titleEl.textContent = 'Gestão de Permissões & Usuários';
            subEl.textContent = 'Controle de acessos exclusivo da administração Gomex. Bloqueio e liberação de módulos por usuário.';
          } else if (isFrotaCad) {
            titleEl.textContent = 'Frota & Veículos Cadastrados';
            subEl.textContent = 'Cadastro fixo da frota, motoristas titulares, ciclo mensal de vistoria e controle preventivo de troca de óleo.';
          } else if (isOcorrencias) {
            titleEl.textContent = 'Ocorrências & Serviços da Frota';
            subEl.textContent = 'Registro de problemas do dia a dia, serviços agendados, monitoramento dinâmico de tempo médio e paradas de vendedores.';
          } else if (isGastos) {
            titleEl.textContent = 'Custos, Peças & Insumos da Frota';
            subEl.textContent = 'Controle de peças, litros de óleo e gastos por placa, motorista e período com emissão de relatórios.';
          } else if (isGaleria) {
            titleEl.textContent = 'Galeria de Fotos dos Veículos';
            subEl.textContent = 'Registro fotográfico da frota por placa, data da foto, motorista responsável e observações.';
          } else if (isManut) {
            titleEl.textContent = 'Manutenção & Oficina da Frota';
            subEl.textContent = 'Acompanhamento de veículos na oficina, ordens de serviço, previsões de retorno e custos.';
          } else if (isVend) {
            titleEl.textContent = 'Vendedores & Custódia da Frota';
            subEl.textContent = 'Pontualidade dos check-lists, veículos sob responsabilidade e auditoria de troca de motoristas.';
          } else {
            titleEl.textContent = 'Vistorias da frota';
            subEl.textContent = 'Acompanhamento em tempo real, aprovação de liberação e reemissão oficial de check-lists.';
          }
        }

        if (isAdmin) {
          renderAdminPermissoes();
        } else if (isManut) {
          renderManutencaoViewGeral();
        } else if (isOcorrencias) {
          if (typeof renderOcorrenciasView === 'function') renderOcorrenciasView();
        } else if (isAgendamentos) {
          if (typeof renderAgendamentosView === 'function') renderAgendamentosView();
        } else if (isGastos) {
          if (typeof renderGastosView === 'function') renderGastosView();
        } else if (isGaleria) {
          if (typeof renderGaleriaView === 'function') renderGaleriaView();
        } else if (isVend) {
          renderVendedoresView();
        } else if (isFrotaCad) {
          if (typeof renderFrotaCadView === 'function') renderFrotaCadView();
        }
      }
      window.alternarVisaoPrincipal = alternarVisaoPrincipal;

      // Listener para botões Voltar / Avançar do navegador (histórico SPA)
      window.addEventListener('popstate', e => {
        if (!authed) return;
        const visao = (e.state && e.state.visao) ? e.state.visao : obterVisaoPorCaminho(window.location.pathname);
        if (visao) {
          alternarVisaoPrincipal(visao, false);
        }
      });

      // ==============================================================================