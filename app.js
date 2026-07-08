const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const TABLE_NAME = "stage_production_checklists";

const TEAMS_BY_DAY = {
  quarta: [
    { id: "7", label: "7 - Pedro Igor" },
    { id: "8", label: "8 - Jardel" },
  ],
  domingo: [
    { id: "1", label: "1 - Jorge" },
    { id: "2", label: "2 - Lucas Rafael" },
    { id: "3", label: "3 - Ivo" },
    { id: "4", label: "4 - Luccas" },
    { id: "5", label: "5 - Thalys" },
    { id: "6", label: "6 - Caio" },
  ],
};

const CHECKLISTS = {
  P1: [
    {
      id: "p1-caixa-producao",
      section: "Pré-culto",
      title: "Pegar a caixa da produção e conferir os materiais",
      description: "Verifique crachás de acesso, microfones, bodypacks e demais itens necessários.",
    },
    {
      id: "p1-materiais-servir",
      section: "Pré-culto",
      title: "Organizar os materiais de servir",
      description: "Faça a limpeza do púlpito e separe jarra com água e copos descartáveis.",
    },
    {
      id: "p1-palco-limpo",
      section: "Pré-culto",
      title: "Conferir a limpeza e a organização do palco",
      description: "Essa conferência deve ser feita antes da abertura das portas.",
    },
    {
      id: "p1-programacao",
      section: "Pré-culto",
      title: "Conferir a programação com a Coordenação de Culto",
      description: "Organize materiais para elemento criativo, se houver, e confirme a marcação de palco.",
    },
    {
      id: "p1-reuniao-equipe",
      section: "Pré-culto",
      title: "Fazer reunião com a equipe",
      description: "Passe a programação, alinhe as orientações do servir e ore com a equipe.",
    },
    {
      id: "p1-guardar-materiais",
      section: "Pós-culto",
      title: "Organizar o palco e guardar os materiais utilizados",
      description: "Obrigatório para a última equipe dos cultos de 11h e 19h. Guarde microfones e a caixa da produção.",
    },
    {
      id: "p1-devolver-materiais",
      section: "Pós-culto",
      title: "Devolver toalhas sujas e demais materiais",
      description: "Leve tudo para a sala de materiais ao final do serviço.",
    },
  ],
  P3: [
    {
      id: "p3-pilhas",
      section: "Pré-culto",
      title: "Checar as pilhas dos microfones e bodypacks do louvor",
      description: "Confirme se todos os equipamentos estão com carga suficiente para o culto.",
    },
    {
      id: "p3-palco-limpo",
      section: "Pré-culto",
      title: "Garantir a limpeza e a organização do palco",
      description: "Essa conferência deve ser feita antes da abertura das portas.",
    },
    {
      id: "p3-necessidades-louvor",
      section: "Pré-culto",
      title: "Conferir com o time de louvor se precisam de algo",
      description: "Verifique necessidades de apoio antes do início do culto.",
    },
    {
      id: "p3-louvor-salinha",
      section: "Pré-culto",
      title: "Confirmar se o louvor está na salinha antes da contagem",
      description: "Faça essa checagem entre 5 e 10 minutos antes da contagem regressiva.",
    },
    {
      id: "p3-chamar-louvor",
      section: "Durante o culto",
      title: "Chamar o louvor para entrar no palco",
      description: "Acione a entrada no momento combinado da contagem.",
    },
    {
      id: "p3-equipar-louvor",
      section: "Durante o culto",
      title: "Ajudar o louvor a se equipar antes da entrada no palco",
      description: "Apoie com microfones, bodypacks e demais itens necessários.",
    },
  ],
};

const elements = {
  form: document.querySelector("#serviceForm"),
  setupScreen: document.querySelector("#setupScreen"),
  checklistScreen: document.querySelector("#checklistScreen"),
  stepOnePill: document.querySelector("#stepOnePill"),
  stepTwoPill: document.querySelector("#stepTwoPill"),
  volunteerName: document.querySelector("#volunteerName"),
  teamSelect: document.querySelector("#teamSelect"),
  checklistList: document.querySelector("#checklistList"),
  nextButton: document.querySelector("#nextButton"),
  backButton: document.querySelector("#backButton"),
  submitButton: document.querySelector("#submitButton"),
  clearButton: document.querySelector("#clearButton"),
  checklistSummary: document.querySelector("#checklistSummary"),
  submitSummary: document.querySelector("#submitSummary"),
  submitHint: document.querySelector("#submitHint"),
  formMessage: document.querySelector("#formMessage"),
  progressPercent: document.querySelector("#progressPercent"),
  completedCount: document.querySelector("#completedCount"),
  currentTime: document.querySelector("#currentTime"),
  databaseStatusDot: document.querySelector("#databaseStatusDot"),
  databaseStatusTitle: document.querySelector("#databaseStatusTitle"),
  databaseStatusText: document.querySelector("#databaseStatusText"),
};

let supabase = null;
let activeChecklist = [];
let currentScreen = "setup";

function hasSupabaseConfig() {
  return SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;
}

async function setupSupabase() {
  if (!hasSupabaseConfig()) {
    return;
  }

  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function getTeamsForDay(serviceDay) {
  return TEAMS_BY_DAY[serviceDay] || [];
}

function populateTeams(serviceDay = "") {
  const teams = getTeamsForDay(serviceDay);
  elements.teamSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = serviceDay ? "Selecione a equipe" : "Selecione o dia primeiro";
  elements.teamSelect.append(placeholder);
  elements.teamSelect.disabled = teams.length === 0;

  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.label;
    elements.teamSelect.append(option);
  });
}

function getFormSelection() {
  const data = new FormData(elements.form);
  return {
    volunteerName: String(data.get("volunteerName") || "").trim(),
    serviceDay: String(data.get("serviceDay") || ""),
    team: String(data.get("team") || ""),
    role: String(data.get("role") || ""),
  };
}

function getTeamLabel(teamId) {
  const allTeams = Object.values(TEAMS_BY_DAY).flat();
  return allTeams.find((team) => team.id === teamId)?.label || teamId;
}

function formatServiceDay(serviceDay) {
  return serviceDay === "quarta" ? "Quarta" : "Domingo";
}

function updateClock() {
  const now = new Date();
  elements.currentTime.dateTime = now.toISOString();
  elements.currentTime.textContent = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);
}

function updateDatabaseStatus() {
  if (!supabase) {
    elements.databaseStatusTitle.textContent = "Modo teste";
    elements.databaseStatusText.textContent = "Salvando no navegador";
    elements.databaseStatusDot.classList.remove("connected");
    return;
  }

  elements.databaseStatusTitle.textContent = "Supabase ativo";
  elements.databaseStatusText.textContent = "Salvando no banco";
  elements.databaseStatusDot.classList.add("connected");
}

function renderChecklist() {
  const { serviceDay, team, role } = getFormSelection();
  const canRender = serviceDay && team && role;

  elements.checklistList.innerHTML = "";
  activeChecklist = canRender ? CHECKLISTS[role] || [] : [];

  if (!canRender || activeChecklist.length === 0) {
    elements.checklistList.hidden = true;
    updateProgress();
    return;
  }

  let currentSection = "";
  activeChecklist.forEach((item) => {
    if (item.section && item.section !== currentSection) {
      currentSection = item.section;
      const section = document.createElement("div");
      section.className = "checklist-section";
      section.textContent = currentSection;
      elements.checklistList.append(section);
    }

    const label = document.createElement("label");
    label.className = "checklist-item";
    label.htmlFor = item.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = item.id;
    checkbox.name = "checklistItem";
    checkbox.value = item.id;
    checkbox.addEventListener("change", () => {
      label.classList.toggle("done", checkbox.checked);
      updateProgress();
    });

    const copy = document.createElement("span");
    copy.innerHTML = `<strong>${item.title}</strong><small>${item.description}</small>`;

    label.append(checkbox, copy);
    elements.checklistList.append(label);
  });

  elements.checklistList.hidden = false;
  updateProgress();
}

function updateProgress() {
  const checkedItems = [...document.querySelectorAll('input[name="checklistItem"]:checked')];
  const total = activeChecklist.length;
  const done = checkedItems.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const { serviceDay, team, role } = getFormSelection();

  elements.progressPercent.textContent = `${percent}%`;
  elements.completedCount.textContent = `${done}/${total}`;
  elements.submitButton.disabled = !(serviceDay && team && role && total > 0 && done === total);

  if (serviceDay && team && role) {
    const summary = `${formatServiceDay(serviceDay)} · ${getTeamLabel(team)} · ${role}`;
    elements.checklistSummary.textContent = summary;
    elements.submitSummary.textContent = summary;
    elements.submitHint.textContent = total
      ? `${done} de ${total} itens concluídos`
      : "Nenhum item configurado para essa função.";
  } else {
    elements.checklistSummary.textContent = "Serviço selecionado";
    elements.submitSummary.textContent = "Aguardando seleção";
    elements.submitHint.textContent = "O envio registra data e hora automaticamente.";
  }
}

function setScreen(screen) {
  currentScreen = screen;
  const isSetup = screen === "setup";

  elements.setupScreen.hidden = !isSetup;
  elements.checklistScreen.hidden = isSetup;
  elements.stepOnePill.classList.toggle("active", isSetup);
  elements.stepTwoPill.classList.toggle("active", !isSetup);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateSetup() {
  const setupFields = [
    elements.volunteerName,
    document.querySelector('input[name="serviceDay"]'),
    elements.teamSelect,
    document.querySelector('input[name="role"]'),
  ];

  return setupFields.every((field) => field.reportValidity());
}

function goToChecklist() {
  if (!validateSetup()) {
    return;
  }

  renderChecklist();
  setMessage("");
  setScreen("checklist");
}

function resetChecklist() {
  document.querySelectorAll('input[name="checklistItem"]').forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.closest(".checklist-item")?.classList.remove("done");
  });
  updateProgress();
  setMessage("");
}

function setMessage(message, type = "default") {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("error", type === "error");
}

function buildPayload() {
  const selection = getFormSelection();
  const completedItems = [...document.querySelectorAll('input[name="checklistItem"]:checked')].map(
    (checkbox) => checkbox.value,
  );
  const submittedAt = new Date().toISOString();

  return {
    volunteer_name: selection.volunteerName,
    service_day: selection.serviceDay,
    team_id: selection.team,
    team_name: getTeamLabel(selection.team),
    role: selection.role,
    completed_items: completedItems,
    total_items: activeChecklist.length,
    submitted_at: submittedAt,
  };
}

function saveLocally(payload) {
  const key = "ccvideira-stage-checklists";
  const records = JSON.parse(localStorage.getItem(key) || "[]");
  records.push(payload);
  localStorage.setItem(key, JSON.stringify(records));
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!elements.form.reportValidity()) {
    return;
  }

  const payload = buildPayload();
  elements.submitButton.disabled = true;
  setMessage("Enviando checklist...");

  try {
    if (supabase) {
      const { error } = await supabase.from(TABLE_NAME).insert(payload);
      if (error) {
        throw error;
      }
    } else {
      saveLocally(payload);
    }

    const sentAt = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(payload.submitted_at));

    setMessage(`Checklist enviado com sucesso em ${sentAt}.`);
    elements.form.reset();
    populateTeams();
    renderChecklist();
    setScreen("setup");
  } catch (error) {
    setMessage(`Não foi possível enviar: ${error.message}`, "error");
    updateProgress();
  }
}

function bindEvents() {
  elements.form.addEventListener("change", (event) => {
    if (event.target.name === "serviceDay") {
      populateTeams(event.target.value);
      renderChecklist();
      return;
    }

    if (["serviceDay", "team", "role"].includes(event.target.name)) {
      renderChecklist();
    } else {
      updateProgress();
    }
  });

  elements.form.addEventListener("input", updateProgress);
  elements.form.addEventListener("submit", handleSubmit);
  elements.nextButton.addEventListener("click", goToChecklist);
  elements.backButton.addEventListener("click", () => setScreen("setup"));
  elements.clearButton.addEventListener("click", resetChecklist);
}

await setupSupabase();
populateTeams();
updateClock();
updateDatabaseStatus();
renderChecklist();
setScreen(currentScreen);
bindEvents();
setInterval(updateClock, 30_000);
