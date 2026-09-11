/** Supabase connection and password authentication manager. */
const DEFAULT_SUPABASE_CONFIG = { url: '', anonKey: '' };

class CloudManager {
  constructor() { this.supabase = null; this.isConfigured = false; this.session = null; this.config = this.loadConfig(); }
  loadConfig() { try { return { ...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(localStorage.getItem('yuvakshetra_supabase_config') || '{}') }; } catch (_) { return DEFAULT_SUPABASE_CONFIG; } }
  async saveConfig(config) {
    if (!window.supabase) throw new Error('Supabase could not load. Check your internet connection and refresh the app.');
    if (!config.url || !config.anonKey) throw new Error('Enter both the project URL and publishable key.');
    const url = config.url.trim().replace(/\/$/, '');
    if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) throw new Error('Use your complete HTTPS Supabase project URL, for example https://abc123.supabase.co.');
    localStorage.setItem('yuvakshetra_supabase_config', JSON.stringify({ url, anonKey: config.anonKey.trim() }));
    this.config = { url, anonKey: config.anonKey.trim() };
    this.supabase = window.supabase.createClient(url, this.config.anonKey); this.isConfigured = true;
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    this.session = data.session; this.updateStatusBadge(); return this.session;
  }
  async initialize() {
    if (!this.config.url || !this.config.anonKey) return;
    if (!window.supabase) { console.error('Supabase library did not load.'); return; }
    this.supabase = window.supabase.createClient(this.config.url, this.config.anonKey); this.isConfigured = true;
    const { data } = await this.supabase.auth.getSession(); this.session = data.session;
    this.supabase.auth.onAuthStateChange((_event, session) => { this.session = session; this.updateStatusBadge(); window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { session } })); });
    this.updateStatusBadge();
  }
  async signIn(email, password) { if (!this.supabase) throw new Error('Set up Supabase first.'); const { data, error } = await this.supabase.auth.signInWithPassword({ email, password }); if (error) throw error; this.session = data.session; return data; }
  async signOut() { if (this.supabase) await this.supabase.auth.signOut(); this.session = null; }
  clearConfig() { localStorage.removeItem('yuvakshetra_supabase_config'); this.supabase = null; this.session = null; this.isConfigured = false; this.config = DEFAULT_SUPABASE_CONFIG; this.updateStatusBadge(); }
  updateStatusBadge() { const badge = document.getElementById('cloud-sync-btn'), text = document.getElementById('cloud-status-text'), homeBadge = document.getElementById('home-cloud-badge'); const connected = this.isConfigured && this.session; if (badge) { badge.className = `cloud-status-btn ${connected ? 'connected' : 'disconnected'}`; badge.title = connected ? `Signed in as ${this.session.user.email}` : 'Set up Supabase or sign in'; } if (text) text.textContent = connected ? 'Supabase Connected' : 'Sign in / Set up'; if (homeBadge) { homeBadge.className = `status-pill-glass${connected ? ' connected' : ''}`; homeBadge.textContent = connected ? 'Supabase Cloud Sync Active' : 'Local mode — sign in to enable Supabase sync'; } }
}
window.cloudManager = new CloudManager();
