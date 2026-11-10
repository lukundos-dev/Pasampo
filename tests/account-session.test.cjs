const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pasampo.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'assets/account-session.js'), 'utf8');
const user = uid => ({ uid, email: uid + '@example.test', displayName: uid, providerData: [] });

function setup(seed = {}) {
  const data = new Map(Object.entries(seed));
  const events = [];
  const listeners = {};
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', style: {}, dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {}, querySelectorAll() { return []; }
    });
    return elements.get(id);
  };
  const context = {
    localStorage: {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: key => data.delete(key)
    },
    document: {
      documentElement: { dataset: {} }, body: { style: {} },
      getElementById: element, querySelectorAll: () => [], querySelector: () => null,
      addEventListener() {}
    },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    setTimeout: () => 0, requestAnimationFrame: () => 0,
    MutationObserver: class { observe() {} },
    IntersectionObserver: class { observe() {} }, console
  };
  context.window = context;
  context.scrollTo = () => {};
  context.addEventListener = (type, callback) => (listeners[type] ||= []).push(callback);
  context.dispatchEvent = event => {
    events.push(event);
    (listeners[event.type] || []).forEach(callback => callback(event));
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, data, events, element, session: context.PasampoSession };
}

test('legacy browser profile never authenticates a visitor', () => {
  const { session, data } = setup({ pasampo_user: JSON.stringify({ uid: 'A', verificationStatus: 'verified' }) });
  assert.equal(session.ready, false);
  assert.equal(session.getUser(), null);
  session.setFirebaseUser(null);
  assert.equal(session.ready, true);
  assert.equal(data.has('pasampo_user'), false);
});

test('switching accounts does not transfer identity approval, name or phone', () => {
  const { session } = setup();
  session.setFirebaseUser(user('A'));
  session.saveProfile({ uid: 'A', phone: '123', verificationStatus: 'verified' });
  session.setFirebaseUser(user('B'));
  assert.equal(session.getUser().name, 'B');
  assert.equal(session.getUser().phone, '');
  assert.equal(session.getUser().verificationStatus, 'not_started');
});

test('cart, store, messages, orders and listings stay in their own account', () => {
  const { session } = setup();
  const keys = ['pasampo_cart', 'pasampo_store', 'pasampo_convos', 'pasampo_orders', 'pasampo_listings'];
  session.setFirebaseUser(user('A'));
  keys.forEach(key => session.write(key, ['A-private']));
  session.setFirebaseUser(user('B'));
  keys.forEach(key => assert.equal(session.read(key, null), null));
  session.setFirebaseUser(user('A'));
  keys.forEach(key => assert.equal(session.read(key, [])[0], 'A-private'));
});

test('refresh requires Firebase confirmation before restoring account data', () => {
  const first = setup();
  first.session.setFirebaseUser(user('A'));
  first.session.saveProfile({ uid: 'A', verificationStatus: 'pending' });
  first.session.write('pasampo_cart', [1]);
  const refreshed = setup(Object.fromEntries(first.data));
  assert.equal(refreshed.session.getUser(), null);
  assert.equal(refreshed.session.read('pasampo_cart', null), null);
  refreshed.session.setFirebaseUser(user('A'));
  assert.equal(refreshed.session.getUser().verificationStatus, 'pending');
  assert.equal(refreshed.session.read('pasampo_cart', [])[0], 1);
});

test('edited cache cannot award identity approval', () => {
  const { session } = setup({ 'pasampo_profile:A': JSON.stringify({ verificationStatus: 'verified', identityVerified: true }) });
  session.setFirebaseUser(user('A'));
  assert.equal(session.getUser().verificationStatus, 'not_started');
  assert.equal(session.saveProfile({ uid: 'B', phone: 'wrong account' }), false);
  const snapshot = session.getUser();
  snapshot.verificationStatus = 'verified';
  assert.equal(session.getUser().verificationStatus, 'not_started');
});

test('session loss revokes access and prevents private writes', () => {
  const { session } = setup();
  session.setFirebaseUser(user('A'));
  session.setFirebaseUser(null);
  assert.equal(session.getUser(), null);
  assert.equal(session.write('pasampo_orders', ['unexpected']), false);
});

test('Firebase bridge clears session on sign-out and observer errors', () => {
  const { context, session } = setup();
  let onUser, onError;
  context.firebase = { initializeApp() {}, auth: () => ({ onAuthStateChanged(a, b) { onUser = a; onError = b; } }) };
  const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(m => m[1].includes('firebase.initializeApp'))[1];
  vm.runInContext(script, context);
  onUser(user('A'));
  onUser(user('B'));
  assert.equal(session.getUser().name, 'B');
  onUser(null);
  assert.equal(session.getUser(), null);
  onUser(user('A'));
  onError(new Error('session unavailable'));
  assert.equal(session.getUser(), null);
});

test('real page session handler clears private screens on account switch', () => {
  const { context, session, element } = setup();
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.filter(s => s.trim() && !s.includes('firebase.initializeApp')).forEach(s => vm.runInContext(s, context));
  session.setFirebaseUser(user('A'));
  context.navigate('inbox');
  element('chat-panel').innerHTML = 'A-private-message';
  element('co-body').innerHTML = 'A-private-payment';
  session.setFirebaseUser(user('B'));
  assert.equal(element('chat-panel').innerHTML, '');
  assert.equal(element('co-body').innerHTML, '');
  assert.equal(vm.runInContext('currentPage', context), 'home');
  assert.equal(context.getUser().uid, 'B');
});

test('badge thresholds apply only to sample fixtures, never browser-owned approval', () => {
  const { context } = setup();
  const fn = name => html.match(new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'))[0];
  vm.runInContext('const PRODUCTS = [];\n' + fn('hasTierOneIdentity') + '\n' + fn('hasTierTwoBadge'), context);
  const fixture = { identityVerified: true, reviews: 100, rating: 4 };
  context.fixture = fixture;
  assert.equal(context.hasTierTwoBadge(fixture), false);
  vm.runInContext('PRODUCTS.push(fixture)', context);
  assert.equal(context.hasTierTwoBadge(fixture), true);
  fixture.reviews = 99;
  assert.equal(context.hasTierTwoBadge(fixture), false);
  fixture.reviews = 100; fixture.rating = 3.99;
  assert.equal(context.hasTierTwoBadge(fixture), false);
});

test('delayed checkout and chat actions cannot finish under another account', () => {
  const { context, session } = setup();
  const pending = [];
  context.setTimeout = callback => { pending.push(callback); return pending.length; };
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.filter(s => s.trim() && !s.includes('firebase.initializeApp')).forEach(s => vm.runInContext(s, context));
  session.setFirebaseUser(user('A'));
  context.saveConvos([{ id: 'convo-A', storeName: 'A store', messages: [] }]);
  context.openConvo = () => {};
  context.sendMsg('Hello', 'convo-A');
  vm.runInContext('coProduct = PRODUCTS[0]', context);
  context.submitLencoPlaceholder();
  session.setFirebaseUser(user('B'));
  pending.forEach(callback => callback());
  assert.equal(context.getConvos().length, 0);
  assert.equal(context.storageGet('pasampo_orders', []).length, 0);
});

test('all inline scripts parse and published HTML matches prototype', () => {
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), html);
});
