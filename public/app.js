// Logique de la page. `kit` vient de /vibe-kit.js (fourni par la lib).
const $ = (id) => document.getElementById(id);

function show(section) {
  $("loading").hidden = true;
  $("login").hidden = section !== "login";
  $("app").hidden = section !== "app";
}

function message(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle("error", isError);
}

// --- Connexion ---

$("google").addEventListener("click", () => {
  kit.signInWithGoogle("/").catch((e) => message($("login-msg"), e.message, true));
});

$("magic").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    await kit.sendMagicLink($("email").value, "/");
    message($("login-msg"), "Lien envoyé ! Vérifiez votre boîte mail (et les spams).");
  } catch (e) {
    message($("login-msg"), e.message, true);
  } finally {
    button.disabled = false;
  }
});

$("logout").addEventListener("click", () => kit.signOut());

// --- Notes (exemple) ---

function renderNote(note) {
  const li = document.createElement("li");
  const text = document.createElement("span");
  text.textContent = note.text; // textContent : jamais innerHTML avec des données utilisateur
  const del = document.createElement("button");
  del.className = "btn btn-ghost";
  del.textContent = "Supprimer";
  del.addEventListener("click", async () => {
    try {
      await kit.api(`/api/notes/${note.id}`, { method: "DELETE" });
      li.remove();
      $("empty").hidden = $("notes").children.length > 0;
    } catch (e) {
      message($("app-msg"), e.message, true);
    }
  });
  li.append(text, del);
  return li;
}

async function loadNotes() {
  const notes = await kit.api("/api/notes");
  $("notes").replaceChildren(...notes.map(renderNote));
  $("empty").hidden = notes.length > 0;
}

$("note-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("note-text");
  try {
    const note = await kit.api("/api/notes", { body: { text: input.value } });
    $("notes").prepend(renderNote(note));
    $("empty").hidden = true;
    input.value = "";
    message($("app-msg"), "");
  } catch (e) {
    message($("app-msg"), e.message, true);
  }
});

// --- Démarrage ---

(async () => {
  try {
    const user = await kit.me();
    if (!user) {
      $("google").hidden = !kit.providers.google;
      $("or").hidden = !kit.providers.google;
      show("login");
      return;
    }
    $("user-email").textContent = user.email;
    show("app");
    await loadNotes();
  } catch (e) {
    show("login");
    message($("login-msg"), e.message, true);
  }
})();
