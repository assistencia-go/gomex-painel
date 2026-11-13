      const $ = id => document.getElementById(id);
      window.$ = $;

      // Constantes de Conexão Segura (Todas as requisições passam pelo backend protegido do Worker/Servidor)
      const SUPABASE_URL = 'https://lhjeodmnqwsftifdvaru.supabase.co';
      const apiKey = () => '';

      const AUTH_KEY = 'gomex_painel_auth_v1';
      const THEME_KEY = 'gomex_painel_theme_v1';
      const SOUND_KEY = 'gomex_painel_sound_v1';
      const PAGE_SIZE = 15;
      const POLL_MS = 8000;

      const LIST_COLS = 'id,numero,created_at,veiculo,veiculo_outro,placa,km,motorista,rota,data,hora,tipo,combustivel,liberacao,avarias,sem_avarias,pneus,pneu_dano,itens,obs,rev_ult_km,rev_ult_data,rev_prox_km,rev_prox_data,condicao_motorista,extintor_validade,thermo_temp,status';
      const SIG_COLS = 'id,ass_motorista,ass_vistoriador,ass_responsavel';

      const STATUS = {
        Liberado: { label: 'Liberado', cls: 'tag-ok' },
        Ressalva: { label: 'Com ressalva', cls: 'tag-warn' },
        'Não liberado': { label: 'Bloqueado', cls: 'tag-bad' },
        Inativo: { label: 'Inativa', cls: 'tag-inativo' }
      };

      const state = {
        all: [],
        filtered: [],
        sigCache: {},
        known: new Set(),
        fresh: new Set(),
        loaded: false,
        error: false,
        lastSync: null,
        status: '',
        q: '',
        veic: '',
        per: '',
        rota: '',
        alertOnly: false,
        alertType: '',
        sortCol: 'data',
        sortAsc: false,
        page: 1,
        sel: null,
        sig: '',
        theme: localStorage.getItem(THEME_KEY) || 'dark',
        sound: localStorage.getItem(SOUND_KEY) !== 'muted',
        decisaoAtual: null,
        visaoAtual: 'vistorias',
        filtroVend: 'todos',
        filtroVendEquipe: 'todos',
        filtroVendBusca: '',
        equipe: '',
        currentUser: ''
      };
      window.state = state;

      let pollTimer = null;
      let loading = false;
      let authed = false;
      let lastFocus = null;

      // ==============================================================================