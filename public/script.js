const screens = [...document.querySelectorAll(".screen")];
const nextBtns = [...document.querySelectorAll("[data-next]")];

const STORAGE_KEY = "charos_final_answers_v1";
const SENT_KEY = "charos_final_sent_v1";

let currentIndex = 0;
let answers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let alreadySent = localStorage.getItem(SENT_KEY) === "true";
let sending = false;

function showScreen(index) {
  screens.forEach((screen, i) => {
    screen.classList.toggle("active", i === index);
  });
  currentIndex = index;
}

function collectScreenData(screen) {
  const fields = [...screen.querySelectorAll("input, textarea, select")];

  for (const field of fields) {
    const value = field.value.trim();

    if (field.required && !value) {
      field.focus();
      field.classList.add("error");
      setTimeout(() => field.classList.remove("error"), 1000);
      return false;
    }

    if (field.name) {
      answers[field.name] = value;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  return true;
}

function fillSavedAnswers() {
  for (const [name, value] of Object.entries(answers)) {
    const field = document.querySelector(`[name="${CSS.escape(name)}"]`);
    if (field && value) field.value = value;
  }
}

nextBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const screen = screens[currentIndex];

    if (!collectScreenData(screen)) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < screens.length) showScreen(nextIndex);

    if (screen.dataset.page === "memory") startGift();
  });
});

function startGift() {
  const countdown = document.getElementById("countdown");
  const giftContent = document.getElementById("giftContent");

  let count = 3;
  countdown.textContent = count;

  const timer = setInterval(() => {
    count -= 1;

    if (count > 0) {
      countdown.textContent = count;
      return;
    }

    clearInterval(timer);
    countdown.classList.add("hidden");
    giftContent.classList.remove("hidden");

    startTyping();

    const video = document.getElementById("giftVideo");
    if (video) video.play().catch(() => {});
  }, 1000);
}

function startTyping() {
  const el = document.getElementById("typeText");
  if (!el) return;

  const text =
    "Charos... bu sahifa oddiy gap emas. Men seni ko‘rganimdan beri yuragimda boshqacha iliqlik bor. Sen kulganingda dunyom yorishadi. Men mukammal bo‘lmasam ham, seni asrashga, tushunishga, qadrlashga va har kuni ko‘proq sevishga chin dildan harakat qilaman. Sen mening eng chiroyli duoyimsan.";

  el.textContent = "";
  let i = 0;

  const interval = setInterval(() => {
    el.textContent += text[i] || "";
    i += 1;

    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 28);
}

async function sendFinalAnswer(loveAnswer) {
  if (sending || alreadySent) return true;

  sending = true;

  answers.love_answer = loveAnswer;
  answers.finished_at = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error(data.message || data);
      sending = false;
      return false;
    }

    alreadySent = true;
    localStorage.setItem(SENT_KEY, "true");
    sending = false;
    return true;
  } catch (err) {
    console.error(err);
    sending = false;
    return false;
  }
}

const showQuestionBtn = document.getElementById("showQuestion");
showQuestionBtn?.addEventListener("click", () => {
  const questionIndex = screens.findIndex(
    (screen) => screen.dataset.page === "question"
  );

  showScreen(questionIndex);
});

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const answerBox = document.getElementById("answerBox");

yesBtn?.addEventListener("click", async () => {
  yesBtn.disabled = true;
  if (noBtn) noBtn.disabled = true;

  const oldYesText = yesBtn.innerHTML;
  yesBtn.innerHTML = "Bir soniya... ❤️";

  const ok = await sendFinalAnswer("Ha, sevaman ❤️");

  yesBtn.innerHTML = oldYesText;
  yesBtn.disabled = false;
  if (noBtn) noBtn.disabled = false;

  if (!ok) {
    answerBox.classList.remove("hidden");
    answerBox.innerHTML = `
      <h3>Internet bilan muammo bo‘ldi 🥺</h3>
      <p>Iltimos, yana bir marta urinib ko‘r ❤️</p>
    `;
    return;
  }

  answerBox.classList.remove("hidden");
  answerBox.innerHTML = `
    <h3>Men ham seni juda ham sevaman ❤️</h3>
    <p>Rahmat, Charos. Bu javobing men uchun dunyodagi eng chiroyli sovg‘a bo‘ldi.</p>
    <p>Rahmatulloh ❤️ Charos</p>
  `;

  createHeartRain();
});

function moveNoButton() {
  if (!noBtn || noBtn.disabled) return;

  const maxX = Math.min(150, window.innerWidth * 0.28);
  const maxY = 90;

  const x = Math.floor(Math.random() * maxX - maxX / 2);
  const y = Math.floor(Math.random() * maxY - maxY / 2);

  noBtn.style.transform = `translate(${x}px, ${y}px)`;
}

noBtn?.addEventListener("mouseenter", moveNoButton);
noBtn?.addEventListener("touchstart", moveNoButton, { passive: true });

noBtn?.addEventListener("click", async () => {
  noBtn.disabled = true;
  if (yesBtn) yesBtn.disabled = true;

  const oldNoText = noBtn.innerHTML;
  noBtn.innerHTML = "Bir soniya... ❤️";

  const ok = await sendFinalAnswer("Yo‘q... lekin birga harakat qilamiz 🥹");

  noBtn.innerHTML = oldNoText;
  noBtn.disabled = false;
  if (yesBtn) yesBtn.disabled = false;

  if (!ok) {
    answerBox.classList.remove("hidden");
    answerBox.innerHTML = `
      <h3>Internet bilan muammo bo‘ldi 🥺</h3>
      <p>Iltimos, yana bir marta urinib ko‘r ❤️</p>
    `;
    return;
  }

  answerBox.classList.remove("hidden");
  answerBox.innerHTML = `
    <h3>Mayli... 🥹</h3>
    <p>Men seni majburlay olmayman. Lekin men seni chin qalbimdan sevaman.</p>
    <p>Sen ham meni sevib qolishing uchun birga harakat qilamiz, maylimi? ❤️</p>
  `;

  createHeartRain();
});

function createHeartRain() {
  for (let i = 0; i < 55; i++) {
    const heart = document.createElement("div");

    heart.className = "heart-rain";
    heart.textContent = ["❤️", "💖", "🌸", "💕", "🌹"][
      Math.floor(Math.random() * 5)
    ];

    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = 2 + Math.random() * 3 + "s";
    heart.style.fontSize = 18 + Math.random() * 22 + "px";

    document.body.appendChild(heart);

    setTimeout(() => heart.remove(), 5200);
  }
}

function makePetals() {
  const petals = document.getElementById("petals");
  if (!petals) return;

  for (let i = 0; i < 30; i++) {
    const span = document.createElement("span");

    span.textContent = ["🌸", "🌹", "💗"][Math.floor(Math.random() * 3)];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 8 + "s";
    span.style.animationDuration = 6 + Math.random() * 8 + "s";

    petals.appendChild(span);
  }
}

function makeSparkles() {
  const sparkles = document.getElementById("sparkles");
  if (!sparkles) return;

  for (let i = 0; i < 42; i++) {
    const span = document.createElement("span");

    span.style.left = Math.random() * 100 + "%";
    span.style.top = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 4 + "s";

    sparkles.appendChild(span);
  }
}

fillSavedAnswers();
makePetals();
makeSparkles();
showScreen(0);