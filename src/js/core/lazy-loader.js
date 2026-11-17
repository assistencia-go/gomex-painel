      // ==============================================================================
      // LOADER SOB DEMANDA (CODE SPLITTING DE TELAS E MODAIS PESADOS)
      // ==============================================================================
      const _lazyReady = { admin: false, galeria: false, catalogo: false };
      const _lazyPromises = {};
      const _LAZY_TARGETS = {
        admin: { sectionId: 'sectionAdminPermissoesView', modalMount: true },
        galeria: { sectionId: 'sectionGaleriaView', modalMount: true },
        catalogo: { sectionId: null, modalMount: true }
      };

      window.__isLazyLoaded = function (name) {
        return Boolean(_lazyReady[name]);
      };

      async function ensureLazyChunk(name) {
        if (_lazyReady[name]) return true;
        if (_lazyPromises[name]) return _lazyPromises[name];

        _lazyPromises[name] = (async () => {
          try {
            const res = await fetch('/chunks/' + name + '.json', { cache: 'default' });
            if (!res || !res.ok) throw new Error('HTTP ' + (res ? res.status : 0));
            const data = await res.json();
            if (!data || typeof data !== 'object' || (!data.html && !data.modalsHtml && !data.css && !data.js)) {
              return false;
            }

            if (data.css && document && document.createElement) {
              const styleId = 'lazy-css-' + name;
              if (!document.getElementById(styleId)) {
                const st = document.createElement('style');
                st.id = styleId;
                st.textContent = data.css;
                const host = document.head || document.body || document.documentElement;
                if (host && typeof host.appendChild === 'function') host.appendChild(st);
              }
            }

            const targetCfg = _LAZY_TARGETS[name] || {};
            if (data.html && targetCfg.sectionId) {
              const sec = $(targetCfg.sectionId);
              if (sec && typeof sec.innerHTML === 'string') {
                sec.innerHTML = data.html;
              }
            }

            if (data.modalsHtml && targetCfg.modalMount) {
              const mount = $('lazyModalsMount');
              if (mount && document && document.createElement) {
                const tmp = document.createElement('div');
                tmp.innerHTML = data.modalsHtml;
                if (typeof mount.appendChild === 'function') {
                  while (tmp.firstChild) {
                    mount.appendChild(tmp.firstChild);
                  }
                }
              }
            }

            if (data.js && typeof data.js === 'string') {
              (new Function('"use strict";\n' + data.js))();
            }

            _lazyReady[name] = true;
            if (typeof aplicarPermissoesUi === 'function') aplicarPermissoesUi();
            return true;
          } catch (err) {
            if (typeof console !== 'undefined' && console.error) {
              console.error('[LazyLoader] Falha carregando chunk ' + name + ':', err);
            }
            if (typeof toast === 'function') {
              toast('Conecte-se à internet para carregar este módulo.', 'error');
            }
            return false;
          } finally {
            delete _lazyPromises[name];
          }
        })();

        return _lazyPromises[name];
      }
      window.ensureLazyChunk = ensureLazyChunk;

      function registerLazyProxy(chunkName, fnName) {
        const proxy = function (...args) {
          if (_lazyReady[chunkName]) {
            const real = window[fnName];
            if (typeof real === 'function' && !real.__isLazyProxy) {
              return real.apply(this, args);
            }
            return;
          }
          return ensureLazyChunk(chunkName).then(ok => {
            if (!ok) return;
            const real = window[fnName];
            if (typeof real === 'function' && !real.__isLazyProxy) {
              return real.apply(this, args);
            }
          });
        };
        proxy.__isLazyProxy = true;
        window[fnName] = proxy;
      }

      function registerLazyNoopIfUnloaded(chunkName, fnName) {
        const proxy = function (...args) {
          if (!_lazyReady[chunkName]) return;
          const real = window[fnName];
          if (typeof real === 'function' && !real.__isLazyProxy) {
            return real.apply(this, args);
          }
        };
        proxy.__isLazyProxy = true;
        window[fnName] = proxy;
      }

      [
        'renderAdminPermissoes', 'carregarArmazenamentoSupabase', 'alterarPlanoSupabaseMonitor',
        'copiarSqlMedicaoSupabase', 'togglePermissaoClick', 'togglePermissaoEdicaoClick',
        'definirModoSomenteLeitura', 'definirModoEdicaoLiberada', 'definirTodasPermissoesUsuario',
        'definirApenasOcorrenciasUsuario', 'alternarStatusUsuario', 'excluirUsuarioCustom',
        'filtrarUsuariosAdmin', 'salvarPermissoesUsuarios', 'mostrarToastSucessoPermissoes',
        'abrirModalNovoUsuario', 'abrirModalEditarUsuario', 'confirmarNovoUsuario',
        'abrirModalAlterarSenha', 'confirmarAlteracaoSenha', 'obterTodosUsuariosAdmin',
        'renderizarArmazenamentoSupabaseUI'
      ].forEach(fn => registerLazyProxy('admin', fn));

      ['atualizarBadgeSyncSupabaseAdmin', 'fecharModalNovoUsuario', 'fecharModalAlterarSenha']
        .forEach(fn => registerLazyNoopIfUnloaded('admin', fn));

      [
        'renderGaleriaView', 'abrirModalSubirFoto', 'onDigitarPlacaNoModalGaleria',
        'acionarSeletorFotosGaleria', 'limparUploadsDraftGaleria', 'onSelecionarArquivosGaleria',
        'removerUploadDraftGaleria', 'salvarFotosGaleria', 'abrirPastaGaleria',
        'adicionarFotosGaleria', 'fecharPastaGaleria', 'alternarModoGaleria',
        'irParaGaleriaDaPlaca', 'limparFiltrosGaleria', 'abrirLightboxFoto',
        'baixarFotoGaleria', 'excluirFotoGaleria'
      ].forEach(fn => registerLazyProxy('galeria', fn));

      ['fecharModalSubirFoto', 'fecharLightboxFoto']
        .forEach(fn => registerLazyNoopIfUnloaded('galeria', fn));

      [
        'abrirModalCatalogoProdutos', 'limparFormCatalogoProduto', 'salvarProdutoNoCatalogo',
        'editarProdutoCatalogo', 'excluirProdutoCatalogo', 'renderTabelaCatalogoProdutos'
      ].forEach(fn => registerLazyProxy('catalogo', fn));

      registerLazyNoopIfUnloaded('catalogo', 'fecharModalCatalogoProdutos');

