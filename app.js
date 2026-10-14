// NouillesApp V1: a shared "to buy" list.
//
// How it works, in short:
//  - "items" is our list in memory. render() draws it on screen.
//  - Every change updates the screen first (feels instant), then goes to Supabase.
//  - Supabase tells the OTHER phone about changes (realtime), and it reloads the list.
//  - We keep a copy of the list in localStorage so it still shows with no network.
//  - If config.js has no keys yet, we run in "local mode": no sync, this phone only.

const CACHE_KEY = "nouillesapp-items";

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("new-item");

let items = [];       // each item: { id, text, done, created_at }
let db = null;        // the Supabase client (stays null in local mode)

// ---------- Small helpers ----------

function setStatus(text) { statusEl.textContent = text; }

// Save the list on this phone so we can show it offline
function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch (e) {}
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch (e) { return []; }
}

// Make a unique id. Works without a server, so adding is instant.
function newId() { return crypto.randomUUID(); }

// ---------- Drawing the list ----------

function render() {
  listEl.innerHTML = "";
  emptyEl.hidden = items.length > 0;

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "row" + (item.done ? " done" : "");

    // The tick box
    const check = document.createElement("button");
    check.className = "check";
    check.setAttribute("aria-label", "Tick item");
    check.onclick = () => toggleItem(item.id);

    // The text. textContent (not innerHTML) so typed text can never run as code.
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = item.text;

    // The delete button
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "x";
    del.setAttribute("aria-label", "Delete item");
    del.onclick = () => deleteItem(item.id);

    li.append(check, label, del);
    listEl.append(li);
  }
}

// ---------- Changing the list ----------

async function addItem(text) {
  const item = { id: newId(), text, done: false, created_at: new Date().toISOString() };
  items.push(item);          // 1. show it right away
  saveCache(); render();
  if (db) await send(db.from("items").insert(item));   // 2. tell Supabase
}

async function toggleItem(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.done = !item.done;
  saveCache(); render();
  if (db) await send(db.from("items").update({ done: item.done }).eq("id", id));
}

async function deleteItem(id) {
  items = items.filter((i) => i.id !== id);
  saveCache(); render();
  if (db) await send(db.from("items").delete().eq("id", id));
}

// Run a Supabase request and show a message if it fails (e.g. no network)
async function send(request) {
  const { error } = await request;
  if (error) setStatus("offline: change not saved");
}

// ---------- Syncing with Supabase ----------

// Download the full list from Supabase
async function fetchItems() {
  const { data, error } = await db.from("items").select("*").order("created_at");
  if (error) { setStatus("offline: showing last list"); return; }
  items = data;
  saveCache(); render();
  setStatus("synced");
}

function startSync() {
  db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  fetchItems();

  // Listen for changes from the other phone. On any change, reload the list.
  db.channel("items-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, fetchItems)
    .subscribe();

  // When the network comes back, or the app is reopened, refresh.
  window.addEventListener("online", fetchItems);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) fetchItems();
  });
  window.addEventListener("offline", () => setStatus("offline: showing last list"));
}

// ---------- Start ----------

formEl.addEventListener("submit", (e) => {
  e.preventDefault();                 // stop the page from reloading
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";
  addItem(text);
});

items = loadCache();                  // show the last list immediately
render();

if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  setStatus("connecting...");
  startSync();
} else {
  setStatus("local mode (no sync yet)");
}

// Register the service worker so the app can install and work offline
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
