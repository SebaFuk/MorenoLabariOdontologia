/* Supabase config — Odontología Moreno Labari
   Public anon/publishable key. RLS protege escrituras.
*/
window.ML_SB_URL = 'https://gnjmtmoyefxdirrxvtqt.supabase.co';
window.ML_SB_KEY = 'sb_publishable_M6L5h2hxZiSTFtsbii7k8A_nAgTyl-Q';

(function () {
  if (!window.supabase) {
    console.error('Supabase SDK no cargó. Verificá conexión.');
    return;
  }
  window.MLSupabase = window.supabase.createClient(window.ML_SB_URL, window.ML_SB_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
      storageKey: 'ml_sb_session'
    }
  });
})();
