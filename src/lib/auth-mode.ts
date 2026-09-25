// Feature flag da migração de login.
// false = login antigo (LoginGate local) — padrão atual, sistema segue como antes.
// true  = login real (conta no backend + papel owner/staff).
// Só ligar DEPOIS de criar o primeiro owner (ver docs/fase1-auth.md).
export const USE_SUPABASE_AUTH = false;
