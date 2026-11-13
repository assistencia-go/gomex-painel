      // MODAL: COBRANÇA WHATSAPP EM 1 CLIQUE COM TEXTO PRONTO PARA COPIAR E COLAR
      // ==============================================================================
      function abrirModalCopiarWhatsApp(motoristaNome, placaRaw, tipoAviso, extra) {
        tipoAviso = tipoAviso || 'vistoria_mensal';
        extra = extra || {};
        var p = (placaRaw || '').toUpperCase().trim();
        var infoPlaca = p ? obterInfoPlacaNaFrota(p) : { placa: p, veiculo: '', motorista: motoristaNome };
        var mot = (motoristaNome || infoPlaca.motorista || 'Motorista').trim();
        var veic = infoPlaca.veiculo || 'veículo da frota';

        if ($('wppDestinatarioInfo')) {
          $('wppDestinatarioInfo').innerHTML = 'Destinatário: <strong>' + esc(mot) + '</strong>' + (veic ? ' · <span style="color:var(--ink-3)">' + esc(veic) + '</span>' : '');
        }
        if ($('wppPlacaBadge')) {
          $('wppPlacaBadge').textContent = p || 'FROTA';
        }

        var LINK_CHECKLIST = 'https://gomex-checklist.gomexassistencia2026.workers.dev/';
        var partes = [];

        if (tipoAviso === 'vistoria_vencida' || (tipoAviso === 'vistoria_mensal' && Number(extra.atraso) > 0)) {
          var atraso = extra.atraso || 'alguns';
          partes = [
            'Olá, *' + mot + '*! Tudo bem? Aqui é o *Hendreo* da *Gomex Distribuidora*.',
            'Estou acompanhando o controle operacional da frota e verifiquei que o check-list mensal do seu veículo (*' + p + '*' + (veic ? ' - ' + veic : '') + ') está pendente/vencido há *' + atraso + ' dia(s)*.',
            'Por favor, acesse o link abaixo e realize o check-list do veículo hoje mesmo:\n' + LINK_CHECKLIST,
            'Qualquer dúvida ou caso o veículo esteja com alguma avaria ou necessidade de manutenção, me avise por aqui!\nObrigado pela colaboração!'
          ];
        } else if (tipoAviso === 'oleo' || tipoAviso === 'oleo_vencido' || tipoAviso === 'oleo_proximo') {
          var kmInfo = extra.diffKm ? '(previsão de troca em ' + fmtKm(extra.diffKm) + ')' : '';
          partes = [
            'Olá, *' + mot + '*! Tudo bem? Aqui é o *Hendreo* da *Gomex Distribuidora*.',
            'Estamos acompanhando a quilometragem do seu veículo (*' + p + '*' + (veic ? ' - ' + veic : '') + ') e identificamos que está no momento da *troca de óleo e revisão preventiva* ' + kmInfo + '.',
            'Por favor, nos informe o KM atual do painel e verifique a disponibilidade para realizarmos a troca de óleo na oficina.',
            'Aproveite também para atualizar o check-list mensal pelo link:\n' + LINK_CHECKLIST,
            'Conto com seu retorno! Um abraço e boa rota!'
          ];
        } else {
          partes = [
            'Olá, *' + mot + '*! Tudo bem? Aqui é o *Hendreo* da *Gomex Distribuidora*.',
            'Passando para lembrar que está na data de renovação do *check-list mensal* do seu veículo (*' + p + '*' + (veic ? ' - ' + veic : '') + ').',
            'É bem rápido, basta acessar o link e registrar a vistoria com as fotos:\n' + LINK_CHECKLIST,
            'Obrigado pela dedicação e boa rota!'
          ];
        }

        if ($('wppTextoMensagem')) {
          $('wppTextoMensagem').textContent = partes.join('\n\n');
        }

        var btnLbl = $('btnCopiarTextoWppLabel');
        if (btnLbl) btnLbl.textContent = 'Copiar Texto Pronto';

        $('modalCopiarWhatsApp').classList.add('open');
      }
      window.abrirModalCopiarWhatsApp = abrirModalCopiarWhatsApp;

      function fecharModalCopiarWhatsApp() {
        $('modalCopiarWhatsApp').classList.remove('open');
      }
      window.fecharModalCopiarWhatsApp = fecharModalCopiarWhatsApp; {
        $('modalCopiarWhatsApp').classList.remove('open');
      }
      window.fecharModalCopiarWhatsApp = fecharModalCopiarWhatsApp;

      async function executarCopiaTextoWhatsApp() {
        const el = $('wppTextoMensagem');
        if (!el) return;
        const texto = el.textContent || '';
        if (!texto) return;

        let copiou = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(texto);
            copiou = true;
          } catch (e) { }
        }

        if (!copiou) {
          const ta = document.createElement('textarea');
          ta.value = texto;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            copiou = true;
          } catch (e) { }
          document.body.removeChild(ta);
        }

        const btnLbl = $('btnCopiarTextoWppLabel');
        if (btnLbl) {
          btnLbl.textContent = 'Texto Copiado!';
          setTimeout(() => {
            if (btnLbl) btnLbl.textContent = 'Copiar Texto Pronto';
          }, 2400);
        }

        toast('Texto pronto copiado! Abra o WhatsApp do motorista e pressione Ctrl + V para colar.');
      }
      window.executarCopiaTextoWhatsApp = executarCopiaTextoWhatsApp;

      // ==============================================================================