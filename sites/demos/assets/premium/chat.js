// Assistant de démonstration : un chatbot qui répond à partir de réponses préparées.
// Dans un vrai projet, on le brancherait sur une IA ou sur l'équipe ; ici tout reste dans la page.
//
//   <script type="application/json" id="chat">
//   { "name": "Gino", "role": "Assistant Forno Nero", "greeting": "Bonsoir…",
//     "chips": ["Réserver", "Allergènes"],
//     "fallback": "Je n'ai pas la réponse…",
//     "intents": [ { "keys": ["reserv", "table"], "answer": "…", "chips": ["…"], "link": { "label": "Réserver", "href": "#reserver" } } ] }
//   </script>
//   <script type="module" src="../../assets/premium/chat.js"></script>

const source = document.getElementById('chat');
if (source) {
  let config;
  try {
    config = JSON.parse(source.textContent);
  } catch {
    config = null;
  }
  if (config) mount(config);
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ');
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function mount(config) {
  const root = element('div', 'chat');
  root.innerHTML = `
    <button class="chat__launch" type="button" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.6 3.7A.9.9 0 0 1 5 19v-3.1A2.5 2.5 0 0 1 4 13.500z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span class="chat__launch-label"></span>
    </button>
    <section class="chat__panel" id="chat-panel" role="dialog" aria-label="Assistant" hidden>
      <header class="chat__head">
        <div><p class="chat__name"></p><p class="chat__role"></p></div>
        <button class="chat__close" type="button" aria-label="Fermer l’assistant">×</button>
      </header>
      <div class="chat__log" role="log" aria-live="polite"></div>
      <div class="chat__chips"></div>
      <form class="chat__form">
        <input class="chat__input" type="text" autocomplete="off" aria-label="Votre message" placeholder="Écrivez votre question…">
        <button class="chat__send" type="submit" aria-label="Envoyer">→</button>
      </form>
      <p class="chat__note">Démonstration : réponses préparées, rien n’est envoyé.</p>
    </section>`;
  document.body.append(root);

  const launch = root.querySelector('.chat__launch');
  const panel = root.querySelector('.chat__panel');
  const log = root.querySelector('.chat__log');
  const chips = root.querySelector('.chat__chips');
  const form = root.querySelector('.chat__form');
  const input = root.querySelector('.chat__input');
  root.querySelector('.chat__launch-label').textContent = config.launch || 'Une question ?';
  root.querySelector('.chat__name').textContent = config.name || 'Assistant';
  root.querySelector('.chat__role').textContent = config.role || 'Assistant de démonstration';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let greeted = false;

  function say(text, who, link) {
    const bubble = element('div', `chat__msg chat__msg--${who}`);
    bubble.append(element('p', '', text));
    if (link) {
      const anchor = element('a', 'chat__link', link.label);
      anchor.href = link.href;
      anchor.addEventListener('click', () => toggle(false));
      bubble.append(anchor);
    }
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function setChips(list) {
    chips.replaceChildren();
    for (const label of list || []) {
      const chip = element('button', 'chat__chip', label);
      chip.type = 'button';
      chip.addEventListener('click', () => ask(label));
      chips.append(chip);
    }
  }

  function answerFor(question) {
    const words = normalize(question);
    let best = null;
    let score = 0;
    for (const intent of config.intents || []) {
      const hits = intent.keys.filter((key) => words.includes(normalize(key))).length;
      if (hits > score) {
        score = hits;
        best = intent;
      }
    }
    return best || { answer: config.fallback || 'Je transmets votre question à l’équipe.', chips: config.chips };
  }

  function ask(question) {
    const text = question.trim();
    if (!text) return;
    say(text, 'user');
    setChips([]);
    const reply = answerFor(text);
    const typing = element('div', 'chat__msg chat__msg--bot chat__typing');
    typing.append(element('span'), element('span'), element('span'));
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    setTimeout(
      () => {
        typing.remove();
        say(reply.answer, 'bot', reply.link);
        setChips(reply.chips || config.chips);
      },
      reduced ? 0 : 500 + Math.min(900, reply.answer.length * 6)
    );
  }

  function toggle(open) {
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    if (open) {
      if (!greeted) {
        greeted = true;
        say(config.greeting || 'Bonjour, comment puis-je vous aider ?', 'bot');
        setChips(config.chips);
      }
      input.focus({ preventScroll: true });
    } else {
      launch.focus({ preventScroll: true });
    }
  }

  launch.addEventListener('click', () => toggle(panel.hidden));
  root.querySelector('.chat__close').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) toggle(false);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = '';
  });
  // Tout élément [data-chat-open] ouvre l'assistant (bouton « Poser une question », etc.).
  for (const opener of document.querySelectorAll('[data-chat-open]')) {
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      toggle(true);
    });
  }
}
