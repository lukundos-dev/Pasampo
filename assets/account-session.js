(function () {
  'use strict';
  let current = null;
  let settled = false;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* A Firebase session must work even when caching is unavailable. */ }
  }
  function profileKey(uid) { return 'pasampo_profile:' + uid; }
  function notify(previousUid) {
    window.dispatchEvent(new CustomEvent('pasampo-session-change', {
      detail: { previousUid, uid: current?.uid || null }
    }));
  }
  function setFirebaseUser(user) {
    const previousUid = current?.uid || null;
    settled = true;
    try { localStorage.removeItem('pasampo_user'); } catch (_) {}
    if (!user) {
      current = null;
    } else {
      const cached = read(profileKey(user.uid), {});
      current = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Pasampo User',
        email: user.email || '',
        emailVerified: user.emailVerified === true,
        phone: user.phoneNumber || cached.phone || '',
        provider: user.providerData?.[0]?.providerId || 'password',
        verificationStatus: cached.verificationStatus === 'pending' ? 'pending' : 'not_started',
        verificationSubmittedAt: cached.verificationSubmittedAt || null,
        joinedAt: cached.joinedAt || new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      };
    }
    notify(previousUid);
  }
  window.PasampoSession = {
    get ready() { return settled; },
    getUser() { return current ? { ...current } : null; },
    setFirebaseUser,
    saveProfile(profile) {
      if (!current || profile.uid !== current.uid) return false;
      const saved = {
        phone: String(profile.phone || ''),
        verificationStatus: profile.verificationStatus === 'pending' ? 'pending' : 'not_started',
        verificationSubmittedAt: profile.verificationSubmittedAt || null,
        joinedAt: current.joinedAt
      };
      write(profileKey(current.uid), saved);
      current = { ...current, ...saved };
      return true;
    },
    read(key, fallback) {
      return current ? read(key + ':' + current.uid, fallback) : fallback;
    },
    write(key, value) {
      if (!current) return false;
      write(key + ':' + current.uid, value);
      return true;
    }
  };
})();
