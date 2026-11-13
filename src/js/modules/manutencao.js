      // GESTÃO & CONTROLE DE MANUTENÇÃO DE VEÍCULOS
      // ==============================================================================
      const MAINT_KEY_PREFIX = 'gomex_maint_data_';

      function extrairPartesObservacao(rawObs) {
        if (!rawObs) return { textoLivre: '', manutencao: null, auditoria: [] };
        let texto = String(rawObs);
        const auditoria = [];
        let manutencao = null;

        // Extrair tags de inativação e reativação
        const auditRegex = /\[(INATIVADO|REATIVADO)\s+em\s+([^\]]+)\]/gi;
        let aMatch;
        while ((aMatch = auditRegex.exec(texto)) !== null) {
          auditoria.push({ tipo: aMatch[1].toUpperCase(), detalhe: aMatch[2].trim() });
        }
        texto = texto.replace(auditRegex, '').trim();

        // Extrair tag de manutenção (suporta com ou sem colchete final se truncado)
        const maintRegex = /\[MANUTENCAO:\s*status=([^\|\]]+)(?:\|\s*oficina=([^\|\]]*))?(?:\|\s*tipo=([^\|\]]*))?(?:\|\s*entrada=([^\|\]]*))?(?:\|\s*retorno=([^\|\]]*))?(?:\|\s*custo=([^\|\]]*))?(?:\|\s*os=([^\|\]]*))?(?:\|\s*obs=([^\]]*))?\]?/i;
        const mMatch = texto.match(maintRegex);
        if (mMatch) {
          manutencao = {
            status: (mMatch[1] || '').trim(),
            oficina: (mMatch[2] || '').trim(),
            tipo: (mMatch[3] || '').trim(),
            entrada: (mMatch[4] || '').trim(),
            retorno: (mMatch[5] || '').trim(),
            custo: (mMatch[6] || '').trim(),
            os: (mMatch[7] || '').trim(),
            obs: (mMatch[8] || '').trim()
          };
          texto = texto.replace(maintRegex, '').trim();
        }
        return { textoLivre: texto, manutencao, auditoria };
      }

      function formatarObservacoesParaPdf(rawObs, item) {
        const { textoLivre, manutencao, auditoria } = extrairPartesObservacao(rawObs);
        const m = manutencao || (item ? getManutencaoData(item) : null);
        const linhas = [];

        if (m && m.status && m.status !== 'Nenhuma') {
          const isDone = m.status === 'Já foi para manutenção';
          let info = isDone ? 'Manutenção Concluída' : 'Em Manutenção';
          if (m.oficina) info += ' · Oficina: ' + m.oficina;
          if (m.tipo) info += ' (' + m.tipo + ')';
          if (m.entrada) info += ' · Entrada: ' + formatarData(m.entrada);
          if (m.retorno) info += ' · ' + (isDone ? 'Retorno: ' : 'Previsão: ') + formatarData(m.retorno);
          if (m.os) info += ' · OS: ' + m.os;
          if (m.custo) {
            const numC = parseFloat(String(m.custo).replace(/\./g, '').replace(',', '.'));
            info += ' · Custo: ' + (isNaN(numC) ? 'R$ ' + m.custo : 'R$ ' + numC.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
          if (m.obs) info += ' · Obs: ' + m.obs;
          linhas.push(info);
        }

        if (textoLivre) {
          linhas.push('Parecer: ' + textoLivre);
        }

        if (auditoria.length) {
          auditoria.forEach(a => {
            const rotulo = a.tipo === 'INATIVADO' ? 'Inativação' : 'Reativação';
            linhas.push('Auditoria (' + rotulo + '): ' + a.detalhe);
          });
        }

        if (!linhas.length) {
          linhas.push('Nenhuma ressalva cadastrada. Veículo em conformidade operacional.');
        }
        return linhas;
      }

      function getManutencaoData(it) {
        if (!it) return null;

        // 1. Prioriza o dado gravado no banco de dados (campo it.obs no Supabase)
        if (it.obs) {
          const m = extrairPartesObservacao(it.obs).manutencao;
          if (m && m.status && m.status !== 'Nenhuma') {
            let extra = {};
            try {
              const localById = localStorage.getItem(MAINT_KEY_PREFIX + 'id_' + it.id);
              if (localById) extra = JSON.parse(localById) || {};
            } catch (e) { }
            return {
              ...extra,
              ...m,
              updated_at: extra.data_registro || it.data || ''
            };
          }
        }

        // 2. Fallback para registro local específico desta vistoria (caso salvo offline)
        const localById = localStorage.getItem(MAINT_KEY_PREFIX + 'id_' + it.id);
        if (localById) {
          try {
            const parsed = JSON.parse(localById);
            if (parsed && parsed.status && parsed.status !== 'Nenhuma') return parsed;
          } catch (e) { }
        }

        return null;
      }

      function switchDrTab(tab) {
        if (tab === 'editar' && !podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        state.activeDrTab = tab;
        const isVistoria = tab === 'vistoria';
        const isEditar = tab === 'editar';
        const isManut = tab === 'manut';

        const tabVistoria = $('drTabBtnVistoria');
        const tabEditar = $('drTabBtnEditar');
        const tabManut = $('drTabBtnManut');
        const paneVistoria = $('drPaneVistoria');
        const paneEditar = $('drPaneEditar');
        const paneManut = $('drPaneManut');

        if (tabVistoria) tabVistoria.classList.toggle('active', isVistoria);
        if (tabEditar) tabEditar.classList.toggle('active', isEditar);
        if (tabManut) tabManut.classList.toggle('active', isManut);

        if (paneVistoria) paneVistoria.hidden = !isVistoria;
        if (paneEditar) paneEditar.hidden = !isEditar;
        if (paneManut) paneManut.hidden = !isManut;

        if (isEditar && state.sel) {
          povoarFormEdicaoDrawer(state.sel);
        }
      }
      window.switchDrTab = switchDrTab;

      // ==============================================================================