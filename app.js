// NouillesApp V1: home screen + a shared "Courses" (to buy) list.
//
// How it works, in short:
//  - "items" is our list in memory. render() draws the ones that are not done.
//  - Every change updates the screen first (feels instant), then goes to Supabase.
//  - Supabase tells the OTHER phone about changes (realtime), and it reloads the list.
//  - Ticking an item does NOT delete it: it is marked done = true in the database,
//    so we can build a history later. It just stops showing on the list.
//  - We keep a copy of the list in localStorage so it still shows with no network.
//  - If config.js has no keys yet, we run in "local mode": no sync, this phone only.

const CACHE_KEY = "nouillesapp-items";
const FADE_MS = 300;     // how long the fade-out lasts
const UNDO_MS = 4000;    // how long the Undo bar stays

const homeEl = document.getElementById("home");
const coursesEl = document.getElementById("courses");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("new-item");
const okEl = document.getElementById("add-ok");
const bigAddEl = document.getElementById("big-add");
const undoBarEl = document.getElementById("undo-bar");
const undoTextEl = document.getElementById("undo-text");
const undoBtnEl = document.getElementById("undo-btn");

let items = [];       // each item: { id, text, done, created_at }
let db = null;        // the Supabase client (stays null in local mode)
let undoTimer = null; // the timer that hides the Undo bar

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

// ---------- Screens (home / courses) ----------
// The address ends in "#courses" on the Courses screen. Using the address
// means the phone's Back button works for free.

function route() {
  const onCourses = location.hash === "#courses";
  homeEl.hidden = onCourses;
  coursesEl.hidden = !onCourses;
  if (!onCourses) { closeAdd(); hideUndo(); }
}

window.addEventListener("hashchange", route);

// ---------- Drawing the list ----------

function render() {
  const todo = items.filter((i) => !i.done);   // done items stay in the database, hidden here
  listEl.innerHTML = "";
  emptyEl.hidden = todo.length > 0;

  for (const item of todo) {
    const li = document.createElement("li");
    li.className = "row";

    // The tick box
    const check = document.createElement("button");
    check.className = "check";
    check.setAttribute("aria-label", "Tick item");
    check.onclick = () => tickItem(item.id, li);

    // The text. textContent (not innerHTML) so typed text can never run as code.
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = item.text;

    li.append(check, label);
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

// Mark an item done (true) or not done (false), on screen and in Supabase
async function setDone(id, done) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.done = done;
  saveCache(); render();
  if (db) await send(db.from("items").update({ done }).eq("id", id));
}

// Tick: fade the row out, then mark it done and offer Undo
function tickItem(id, li) {
  if (li.classList.contains("fading")) return;   // ignore a double tap
  const item = items.find((i) => i.id === id);
  if (!item) return;
  li.classList.add("fading");                    // CSS fades it out
  setTimeout(() => {
    setDone(id, true);
    showUndo(item);
  }, FADE_MS);
}

// ---------- Undo bar ----------

function showUndo(item) {
  undoTextEl.textContent = item.text + " removed";
  undoBarEl.hidden = false;
  clearTimeout(undoTimer);                       // a new tick restarts the 4 seconds
  undoTimer = setTimeout(hideUndo, UNDO_MS);
  undoBtnEl.onclick = () => { setDone(item.id, false); hideUndo(); };
}

function hideUndo() {
  clearTimeout(undoTimer);
  undoBarEl.hidden = true;
}

// ---------- The add form (opens with the big +) ----------

function openAdd() {
  bigAddEl.hidden = true;
  formEl.hidden = false;
  inputEl.focus();
}

function closeAdd() {
  formEl.hidden = true;
  bigAddEl.hidden = false;
}

bigAddEl.addEventListener("click", openAdd);

formEl.addEventListener("submit", (e) => {
  e.preventDefault();                 // stop the page from reloading
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";
  addItem(text);
  inputEl.focus();                    // stay open so you can type the next one
});

// Tapping the confirm button must not take focus away from the text box,
// otherwise the keyboard would close before the tap counts.
okEl.addEventListener("pointerdown", (e) => e.preventDefault());

// Leaving the text box while it is empty closes the form and brings the + back
inputEl.addEventListener("blur", () => {
  if (!inputEl.value.trim()) closeAdd();
});

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

route();                              // show the right screen for the current address
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
