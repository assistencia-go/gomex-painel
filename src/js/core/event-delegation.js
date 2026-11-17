      // ==============================================================================
      // DELEGAÇÃO CENTRALIZADA DE EVENTOS & FECHAMENTO UNIVERSAL DE MODAIS
      // ==============================================================================
      const COMPOUND_ACTIONS = {
        openDrawerMaint: (el) => {
          if (typeof window.openDrawer === 'function') window.openDrawer(el.dataset.id, el, 'manut');
        },
        drawerGastoSel: () => {
          const sel = window.state && window.state.sel;
          if (sel && typeof window.abrirModalLancarGasto === 'function') {
            window.abrirModalLancarGasto(sel.placa, sel.motorista, sel.km);
          }
        },
        drawerVerGastosSel: () => {
          const sel = window.state && window.state.sel;
          if (sel) {
            if (typeof window.closeDrawer === 'function') window.closeDrawer();
            if (typeof window.irParaGastosDaPlaca === 'function') window.irParaGastosDaPlaca(sel.placa);
          }
        },
        histLancarGasto: () => {
          const p = ($('histPlateTitle')?.textContent || '').trim();
          if (typeof window.fecharHistoricoModal === 'function') window.fecharHistoricoModal();
          if (typeof window.abrirModalLancarGasto === 'function') window.abrirModalLancarGasto(p);
        },
        histSubirFoto: () => {
          const p = ($('histPlateTitle')?.textContent || '').trim();
          if (typeof window.fecharHistoricoModal === 'function') window.fecharHistoricoModal();
          if (typeof window.abrirModalSubirFoto === 'function') window.abrirModalSubirFoto(p);
        },
        histVerGaleria: () => {
          const p = ($('histPlateTitle')?.textContent || '').trim();
          if (typeof window.fecharHistoricoModal === 'function') window.fecharHistoricoModal();
          if (typeof window.irParaGaleriaDaPlaca === 'function') window.irParaGaleriaDaPlaca(p);
        },
        histVerGastos: () => {
          const p = ($('histPlateTitle')?.textContent || '').trim();
          if (typeof window.fecharHistoricoModal === 'function') window.fecharHistoricoModal();
          if (typeof window.irParaGastosDaPlaca === 'function') window.irParaGastosDaPlaca(p);
        },
        fecharCatalogoELancarGasto: () => {
          if (typeof window.fecharModalCatalogoProdutos === 'function') window.fecharModalCatalogoProdutos();
          if (typeof window.abrirModalLancarGasto === 'function') window.abrirModalLancarGasto();
        },
        fecharVendedorEAbrirRelatorio: () => {
          if (typeof window.fecharModalVendedor === 'function') window.fecharModalVendedor();
          if (typeof window.abrirModalRelatorioSupervisores === 'function') window.abrirModalRelatorioSupervisores('todos');
        },
        ocrHoraAgoraEAtualizar: (el) => {
          if (typeof window.definirHoraAgora === 'function') window.definirHoraAgora(el.dataset.arg);
          if (typeof window.aoMudarDataOuHoraOcorrencia === 'function') window.aoMudarDataOuHoraOcorrencia();
        }
      };

      const MODAL_BACKDROP_CLOSERS = {
        modalLancarGasto: 'fecharModalLancarGasto',
        modalNotificacoesPush: 'fecharModalNotificacoesPush',
        modalCatalogoProdutos: 'fecharModalCatalogoProdutos',
        modalSubirFotoGaleria: 'fecharModalSubirFoto',
        modalVerFotoGaleria: 'fecharLightboxFoto',
        modalCopiarWhatsApp: 'fecharModalCopiarWhatsApp',
        modalCadastrarVeiculo: 'fecharModalCadastrarVeiculo',
        modalNovoUsuario: 'fecharModalNovoUsuario',
        modalAlterarSenha: 'fecharModalAlterarSenha',
        modalEditarVendedor: 'fecharModalEditarVendedor'
      };

      function resolveActionArgs(el, e) {
        const resolveToken = (v) => {
          if (v === '__EVENT__') return e;
          if (v === '__STATE_SEL__') return window.state ? window.state.sel : null;
          if (v === '__THIS__') return el;
          return v;
        };
        if (el.dataset.args) {
          try {
            const parsed = JSON.parse(el.dataset.args);
            if (Array.isArray(parsed)) return parsed.map(resolveToken);
          } catch (err) { }
        }
        if ('arg' in el.dataset) {
          return [resolveToken(el.dataset.arg)];
        }
        return [];
      }

      function invokeGlobalHandler(fnName, args) {
        const fn = fnName ? window[fnName] : null;
        if (typeof fn === 'function') return fn(...args);
      }

      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('click', (e) => {
          const target = e.target;
          if (!target || typeof target.closest !== 'function') return;

          if (!target.closest('.prod-autocomplete-wrap') && typeof window.fecharTodosMenusSugestaoProd === 'function') {
            window.fecharTodosMenusSugestaoProd();
          }

          // Backdrop click fecha o modal ativo de forma padronizada
          if (
            target.classList &&
            target.classList.contains('modal-overlay') &&
            target.classList.contains('open') &&
            target.id !== 'modalConfirmacaoGlobal'
          ) {
            const closerName = MODAL_BACKDROP_CLOSERS[target.id];
            if (closerName && typeof window[closerName] === 'function') {
              window[closerName]();
            } else {
              target.classList.remove('open');
            }
            return;
          }

          const actEl = target.closest('[data-action], [data-stop]');
          if (!actEl) return;

          if (actEl.dataset.stop === '1') {
            e.stopPropagation();
          }

          const action = actEl.dataset.action;
          if (!action) return;

          if (COMPOUND_ACTIONS[action]) {
            COMPOUND_ACTIONS[action](actEl, e);
            return;
          }

          const args = resolveActionArgs(actEl, e);
          invokeGlobalHandler(action, args);
        });

        document.addEventListener('change', (e) => {
          const el = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-change]') : null;
          if (!el) return;
          const fnName = el.dataset.change;
          const pass = el.dataset.pass;
          if (pass === 'files') invokeGlobalHandler(fnName, [el.files]);
          else if (pass === 'value') invokeGlobalHandler(fnName, [el.value]);
          else invokeGlobalHandler(fnName, []);
        });

        document.addEventListener('input', (e) => {
          const el = e.target && typeof e.target.closest === 'function'
            ? e.target.closest('[data-input], [data-upper="1"], [data-mark-manual="1"]')
            : null;
          if (!el) return;

          if (el.dataset.upper === '1' && typeof el.value === 'string') {
            const up = el.value.toUpperCase();
            if (el.value !== up) {
              const s = el.selectionStart;
              const end = el.selectionEnd;
              el.value = up;
              if (typeof s === 'number' && el.setSelectionRange) {
                try { el.setSelectionRange(s, end); } catch (err) { }
              }
            }
          }

          if (el.dataset.markManual === '1') {
            el.dataset.manual = (el.value || '').trim() ? '1' : '';
          }

          const fnName = el.dataset.input;
          if (!fnName) return;
          const pass = el.dataset.pass;
          invokeGlobalHandler(fnName, pass === 'value' ? [el.value] : []);
        });

        document.addEventListener('submit', (e) => {
          const form = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-submit]') : null;
          if (!form) return;
          e.preventDefault();
          invokeGlobalHandler(form.dataset.submit, [e]);
        });

        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter') return;
          const el = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-enter-submit]') : null;
          if (!el) return;
          e.preventDefault();
          invokeGlobalHandler(el.dataset.enterSubmit, [e]);
        });
      }

