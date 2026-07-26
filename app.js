const STORAGE_KEY = "suno-prompt-studio:v1";
const HISTORY_KEY = "suno-prompt-studio:history:v1";
const API_BASE_KEY = "suno-prompt-studio:api-base:v1";
const DEFAULT_API_BASE = "https://suno-prompt-studio-api.onrender.com";

const fields = {
  title: document.querySelector("#title"),
  theme: document.querySelector("#theme"),
  genre: document.querySelector("#genre"),
  customGenre: document.querySelector("#customGenre"),
  vocal: document.querySelector("#vocal"),
  lyricLanguage: document.querySelector("#lyricLanguage"),
  energy: document.querySelector("#energy"),
  brightness: document.querySelector("#brightness"),
  warmth: document.querySelector("#warmth"),
  complexity: document.querySelector("#complexity"),
  bpm: document.querySelector("#bpm"),
  meter: document.querySelector("#meter"),
  hook: document.querySelector("#hook"),
  structure: document.querySelector("#structure"),
  instruments: document.querySelector("#instruments"),
  lyricDraft: document.querySelector("#lyricDraft"),
  avoid: document.querySelector("#avoid"),
  promptMode: document.querySelector("#promptMode"),
  promptLanguage: document.querySelector("#promptLanguage"),
  detailLevel: document.querySelector("#detailLevel"),
  includeRefs: document.querySelector("#includeRefs"),
  aiMode: document.querySelector("#aiMode"),
  aiCount: document.querySelector("#aiCount"),
  aiInstruction: document.querySelector("#aiInstruction"),
  apiBase: document.querySelector("#apiBase"),
};

const elements = {
  referenceList: document.querySelector("#referenceList"),
  referenceTemplate: document.querySelector("#referenceTemplate"),
  addReferenceButton: document.querySelector("#addReferenceButton"),
  customGenreField: document.querySelector("#customGenreField"),
  lyricDraftField: document.querySelector("#lyricDraftField"),
  hookField: document.querySelector("#hookField"),
  outputText: document.querySelector("#outputText"),
  copyButton: document.querySelector("#copyButton"),
  copySunoButton: document.querySelector("#copySunoButton"),
  aiButton: document.querySelector("#aiButton"),
  applyAiButton: document.querySelector("#applyAiButton"),
  apiStatus: document.querySelector("#apiStatus"),
  apiModel: document.querySelector("#apiModel"),
  testApiButton: document.querySelector("#testApiButton"),
  historyList: document.querySelector("#historyList"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  copyStatus: document.querySelector("#copyStatus"),
  sampleButton: document.querySelector("#sampleButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  promptCounter: document.querySelector("#promptCounter"),
  captionGenre: document.querySelector("#captionGenre"),
  captionBpm: document.querySelector("#captionBpm"),
  coverCanvas: document.querySelector("#coverCanvas"),
  brandCanvas: document.querySelector("#brandCanvas"),
};

const rangeOutputs = {
  energy: document.querySelector("#energyValue"),
  brightness: document.querySelector("#brightnessValue"),
  warmth: document.querySelector("#warmthValue"),
  complexity: document.querySelector("#complexityValue"),
};

const state = {
  activeTab: "final",
  lyricsMode: "outline",
  references: [],
  aiText: "",
  aiEnhancedPrompt: "",
  appliedAiPrompt: "",
  aiVariations: [],
  history: [],
  apiReady: false,
};

let apiBase = getApiBase();

const sampleData = {
  title: "Neon Rain Letters",
  theme:
    "終電後の街で、送れなかったメッセージを読み返す。雨上がりの反射、少しだけ前向きな孤独、朝が来る直前の透明感。",
  genre: ["City Pop"],
  customGenre: "",
  vocal: "female vocal",
  lyricLanguage: "Japanese and English",
  energy: "6",
  brightness: "6",
  warmth: "7",
  complexity: "5",
  bpm: "108",
  meter: "4/4",
  hook: "まだ消せない光がある",
  structure: "intro, verse, pre-chorus, chorus, verse, bridge, final chorus, outro",
  instruments:
    "glossy electric piano, tight city-pop drums, warm finger bass, airy synth pads, clean funk guitar, soft saxophone fills",
  lyricDraft: "",
  avoid: "heavy distortion, comedy tone, aggressive trap drums, copied melodies",
  promptMode: "simple3000",
  promptLanguage: "bilingual",
  detailLevel: "balanced",
  includeRefs: true,
  aiMode: "refine",
  aiCount: "1",
  aiInstruction: "",
  lyricsMode: "outline",
  references: [
    {
      id: createId(),
      title: "Plastic Love",
      artist: "Mariya Takeuchi",
      url: "https://www.youtube.com/watch?v=9Gj47G2e1Jc",
      focus: "mood",
      notes: "night-drive sparkle and bittersweet chorus lift",
    },
    {
      id: createId(),
      title: "Midnight Pretenders",
      artist: "Tomoko Aran",
      url: "",
      focus: "sound design",
      notes: "sleek bass, glassy keys, restrained elegance",
    },
  ],
};

function getEmptyData() {
  return {
    title: "",
    theme: "",
    genre: ["J-pop"],
    customGenre: "",
    vocal: "female vocal",
    lyricLanguage: "Japanese",
    energy: "6",
    brightness: "6",
    warmth: "5",
    complexity: "5",
    bpm: "112",
    meter: "4/4",
    hook: "",
    structure: "intro, verse, pre-chorus, chorus, verse, bridge, final chorus, outro",
    instruments: "",
    lyricDraft: "",
    avoid: "",
    promptMode: "simple3000",
    promptLanguage: "bilingual",
    detailLevel: "balanced",
    includeRefs: true,
    aiMode: "refine",
    aiCount: "1",
    aiInstruction: "",
    lyricsMode: "outline",
    references: [normalizeReference({})],
  };
}

function createId() {
  return `ref-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getGenre() {
  return getGenreLabel(getFormData());
}

function getFormData() {
  return {
    title: fields.title.value.trim(),
    theme: fields.theme.value.trim(),
    genre: getSelectedGenres(),
    customGenre: fields.customGenre.value.trim(),
    vocal: fields.vocal.value,
    lyricLanguage: fields.lyricLanguage.value,
    energy: fields.energy.value,
    brightness: fields.brightness.value,
    warmth: fields.warmth.value,
    complexity: fields.complexity.value,
    bpm: fields.bpm.value,
    meter: fields.meter.value,
    hook: fields.hook.value.trim(),
    structure: fields.structure.value.trim(),
    instruments: fields.instruments.value.trim(),
    lyricDraft: fields.lyricDraft.value.trim(),
    avoid: fields.avoid.value.trim(),
    promptMode: normalizePromptMode(fields.promptMode.value),
    promptLanguage: fields.promptLanguage.value,
    detailLevel: fields.detailLevel.value,
    includeRefs: fields.includeRefs.checked,
    aiMode: fields.aiMode.value,
    aiCount: fields.aiCount.value,
    aiInstruction: fields.aiInstruction.value.trim(),
    lyricsMode: state.lyricsMode,
    references: state.references.map((ref) => ({ ...ref })),
  };
}

function applyFormData(data) {
  const merged = { ...getEmptyData(), ...data };
  merged.promptMode = normalizePromptMode(merged.promptMode);
  merged.genre = normalizeGenreList(merged.genre);
  state.aiText = "";
  state.aiEnhancedPrompt = "";
  state.appliedAiPrompt = "";
  state.aiVariations = [];

  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === "checkbox") {
      field.checked = Boolean(merged[key]);
    } else if (key === "genre") {
      setSelectedGenres(merged.genre);
    } else if (key === "apiBase") {
      field.value = apiBase;
    } else {
      field.value = merged[key];
    }
  });

  state.lyricsMode = merged.lyricsMode || "outline";
  state.references = Array.isArray(merged.references) ? merged.references.map(normalizeReference) : [];
  if (!state.references.length) addReference(false);
  renderReferences();
  updateModeButtons();
  updateOutput();
}

function getSelectedGenres() {
  const selected = Array.from(fields.genre.selectedOptions).map((option) => option.value);
  return selected.length ? selected : ["J-pop"];
}

function setSelectedGenres(genres) {
  const normalized = normalizeGenreList(genres);
  Array.from(fields.genre.options).forEach((option) => {
    option.selected = normalized.includes(option.value);
  });
  if (!Array.from(fields.genre.selectedOptions).length) {
    const fallback = Array.from(fields.genre.options).find((option) => option.value === "J-pop");
    if (fallback) fallback.selected = true;
  }
}

function normalizeGenreList(genre) {
  const values = Array.isArray(genre)
    ? genre
    : String(genre || "J-pop")
        .split(",")
        .map((item) => item.trim());
  const unique = [];
  values.forEach((value) => {
    if (value && !unique.includes(value)) unique.push(value);
  });
  return unique.length ? unique : ["J-pop"];
}

function getGenreList(data) {
  const values = normalizeGenreList(data.genre);
  const customGenre = data.customGenre || "custom pop";
  const genres = values.map((genre) => (genre === "Custom" ? customGenre : genre)).filter(Boolean);
  return genres.length ? genres : ["J-pop"];
}

function getGenreLabel(data) {
  return getGenreList(data).join(", ");
}

function normalizeReference(ref) {
  return {
    id: ref.id || createId(),
    title: ref.title || "",
    artist: ref.artist || "",
    url: ref.url || "",
    focus: ref.focus || "mood",
    notes: ref.notes || "",
  };
}

function addReference(shouldRender = true) {
  state.appliedAiPrompt = "";
  state.references.push(
    normalizeReference({
      id: createId(),
      title: "",
      artist: "",
      url: "",
      focus: "mood",
      notes: "",
    }),
  );

  if (shouldRender) {
    renderReferences();
    updateOutput();
  }
}

function renderReferences() {
  elements.referenceList.innerHTML = "";

  state.references.forEach((ref, index) => {
    const node = elements.referenceTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.refId = ref.id;

    node.querySelectorAll("[data-ref-field]").forEach((input) => {
      const key = input.dataset.refField;
      input.value = ref[key] || "";
      input.addEventListener("input", () => {
        ref[key] = input.value;
        state.appliedAiPrompt = "";
        if (key === "url") renderReferenceThumb(node, ref);
        updateOutput();
      });
    });

    const removeButton = node.querySelector("[data-ref-remove]");
    removeButton.addEventListener("click", () => {
      state.references.splice(index, 1);
      state.appliedAiPrompt = "";
      if (!state.references.length) addReference(false);
      renderReferences();
      updateOutput();
    });

    renderReferenceThumb(node, ref);
    elements.referenceList.appendChild(node);
  });
}

function renderReferenceThumb(node, ref) {
  const box = node.querySelector("[data-ref-thumb]");
  const id = getYouTubeId(ref.url);
  box.innerHTML = "<span>REF</span>";

  if (!id) return;

  const img = document.createElement("img");
  img.alt = ref.title ? `${ref.title} thumbnail` : "YouTube thumbnail";
  img.src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  img.loading = "lazy";

  const link = document.createElement("a");
  link.href = ref.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", "YouTubeで開く");

  box.append(img, link);
}

function getYouTubeId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const markers = ["embed", "shorts", "live"];
    const marker = markers.find((item) => parts.includes(item));
    if (marker) return parts[parts.indexOf(marker) + 1] || "";
  } catch {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{8,})/);
    return match?.[1] || "";
  }
  return "";
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function adjectiveScale(value, low, mid, high) {
  const number = Number(value);
  if (number <= 3) return low;
  if (number >= 8) return high;
  return mid;
}

function buildStyleTags(data) {
  const genre = getGenreLabel(data);
  const energy = adjectiveScale(data.energy, "low-key", "steady", "high-energy");
  const brightness = adjectiveScale(data.brightness, "shadowy", "balanced", "bright");
  const warmth = adjectiveScale(data.warmth, "cool-toned", "warm", "sunlit");
  const complexity = adjectiveScale(data.complexity, "minimal", "polished", "intricate");
  const bpm = clampNumber(data.bpm, 40, 220, 112);
  const instruments = data.instruments || "tasteful drums, bass, keyboards, atmospheric texture";

  return [
    genre,
    data.vocal,
    `${bpm} BPM`,
    data.meter,
    energy,
    brightness,
    warmth,
    complexity,
    instruments,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildReferenceLines(data, language = "en") {
  if (!data.includeRefs) return [];
  return data.references
    .filter((ref) => ref.title || ref.artist || ref.url || ref.notes)
    .map((ref, index) => {
      const name = [ref.title, ref.artist].filter(Boolean).join(" - ") || `Reference ${index + 1}`;
      const source = ref.url ? ` (${ref.url})` : "";
      const notes = ref.notes ? `: ${ref.notes}` : "";
      if (language === "ja") {
        return `- ${name}${source} / 参考点: ${translateFocus(ref.focus)}${notes}`;
      }
      return `- ${name}${source} / focus: ${ref.focus}${notes}`;
    });
}

function translateFocus(focus) {
  const map = {
    mood: "雰囲気",
    arrangement: "構成",
    groove: "グルーヴ",
    "sound design": "音色",
    "lyrical tone": "歌詞感",
  };
  return map[focus] || focus;
}

function buildLyrics(data, language = "en") {
  const isInstrumental = data.lyricsMode === "instrumental" || data.vocal === "instrumental";
  const hook = data.hook || (language === "ja" ? "印象的で短いフック" : "a short memorable hook");
  const structure = data.structure || "intro, verse, chorus, bridge, final chorus, outro";

  if (isInstrumental) {
    return language === "ja"
      ? `歌詞なし。${structure}。メロディは歌いやすい輪郭を持たせ、主旋律を楽器で表現。`
      : `Instrumental track. Structure: ${structure}. Lead melody should feel singable and emotionally clear.`;
  }

  if (data.lyricsMode === "full" && data.lyricDraft) {
    return data.lyricDraft;
  }

  if (language === "ja") {
    return [
      `歌詞言語: ${data.lyricLanguage}`,
      `構成: ${structure}`,
      `フック: 「${hook}」`,
      "各セクションで情景を進め、サビは短く覚えやすく、最後に少しだけ前向きな余韻を残す。",
    ].join("\n");
  }

  return [
    `Lyric language: ${data.lyricLanguage}`,
    `Structure: ${structure}`,
    `Hook phrase: "${hook}"`,
    "Move the scene forward in each section; keep the chorus concise, memorable, and emotionally specific.",
  ].join("\n");
}

function buildEnglishPrompt(data) {
  const title = data.title || "Untitled song";
  const theme = data.theme || "A vivid, emotionally specific song with a strong cinematic scene.";
  const style = buildStyleTags(data);
  const refs = buildReferenceLines(data, "en");
  const lyrics = buildLyrics(data, "en");
  const avoid = data.avoid || "avoid copied melodies, copied lyrics, parody, muddy mix, harsh clipping";

  const sections = [
    `TITLE\n${title}`,
    `SONG DESCRIPTION\nCreate an original song about: ${theme}`,
    `STYLE OF MUSIC\n${style}`,
    `VOCAL AND LYRICS\n${lyrics}`,
  ];

  if (refs.length) {
    sections.push(
      `REFERENCE DIRECTION\nUse these references only as broad inspiration for mood, arrangement, texture, or energy. Do not copy melodies, lyrics, hooks, or distinctive signatures.\n${refs.join("\n")}`,
    );
  }

  sections.push(`AVOID\n${avoid}`);
  sections.push("MIX NOTES\nClear lead vocal, strong chorus lift, balanced low end, polished stereo image.");

  return trimForDetail(sections, data.detailLevel).join("\n\n");
}

function buildJapanesePrompt(data) {
  const title = data.title || "Untitled song";
  const theme = data.theme || "映像が浮かぶ、感情の輪郭がはっきりしたオリジナル曲。";
  const style = buildStyleTags(data);
  const refs = buildReferenceLines(data, "ja");
  const lyrics = buildLyrics(data, "ja");
  const avoid = data.avoid || "メロディや歌詞のコピー、パロディ感、音の濁り、過度な歪み";

  const sections = [
    `タイトル\n${title}`,
    `曲の説明\n${theme}`,
    `音楽スタイル\n${style}`,
    `ボーカル・歌詞\n${lyrics}`,
  ];

  if (refs.length) {
    sections.push(`参考曲の方向性\n参考曲は雰囲気・構成・音色・エネルギーの目安として扱い、メロディ、歌詞、フックはコピーしない。\n${refs.join("\n")}`);
  }

  sections.push(`避けたい要素\n${avoid}`);
  sections.push("ミックス\nリードボーカルを明瞭に、サビの開放感を強く、低域は整理して、全体は磨かれたステレオ感。");

  return trimForDetail(sections, data.detailLevel).join("\n\n");
}

function buildBilingualPrompt(data) {
  const title = data.title || "Untitled song";
  const theme = data.theme || "映像が浮かぶ、感情の輪郭がはっきりしたオリジナル曲。";
  const style = buildStyleTags(data);
  const refs = buildReferenceLines(data, "en");
  const lyrics = buildLyrics(data, "en");
  const avoid = data.avoid || "avoid copied melodies, copied lyrics, parody, muddy mix, harsh clipping";

  const sections = [
    `TITLE / タイトル\n${title}`,
    `CONCEPT / 曲の核\n${theme}`,
    `STYLE OF MUSIC\n${style}`,
    `VOCAL & LYRICS\n${lyrics}`,
  ];

  if (refs.length) {
    sections.push(
      `REFERENCE DIRECTION / 参考曲\nUse references as broad direction only; do not copy melodies, lyrics, hooks, or distinctive signatures.\n${refs.join("\n")}`,
    );
  }

  sections.push(`AVOID / 避けたい要素\n${avoid}`);
  sections.push("MIX / 仕上げ\nclear lead vocal, strong chorus lift, balanced low end, polished stereo image");

  return trimForDetail(sections, data.detailLevel).join("\n\n");
}

function trimForDetail(sections, detailLevel) {
  if (detailLevel === "compact") {
    return sections.filter((section) => !section.startsWith("MIX") && !section.startsWith("ミックス"));
  }

  if (detailLevel === "detailed") {
    return [
      ...sections,
      "EXTRA DIRECTION\nKeep the arrangement evolving every 8 bars. Give the intro a clear identity, let the second chorus feel wider, and make the outro resolve naturally.",
    ];
  }

  return sections;
}

function buildStyleOutput(data) {
  const genre = getGenreLabel(data);
  const refs = buildReferenceLines(data, "en");
  return [
    buildStyleTags(data),
    "",
    "Core tags:",
    `genre: ${genre}`,
    `tempo: ${clampNumber(data.bpm, 40, 220, 112)} BPM`,
    `meter: ${data.meter}`,
    `vocal: ${data.vocal}`,
    `language: ${data.lyricLanguage}`,
    "",
    refs.length ? `reference traits:\n${refs.join("\n")}` : "reference traits: none",
  ].join("\n");
}

function buildRefsOutput(data) {
  const refs = buildReferenceLines(data, data.promptLanguage === "japanese" ? "ja" : "en");
  if (!refs.length) {
    return "参考曲はまだありません。";
  }

  return [
    "Reference notes for Suno prompt",
    "Use as broad creative direction only. Keep melody, lyrics, and hooks original.",
    "",
    refs.join("\n"),
  ].join("\n");
}

function getOutputForActiveTab(data) {
  if (state.activeTab === "style") return buildStyleOutput(data);
  if (state.activeTab === "lyrics") {
    return buildLyrics(data, data.promptLanguage === "japanese" ? "ja" : "en");
  }
  if (state.activeTab === "refs") return buildRefsOutput(data);
  if (state.activeTab === "ai") return state.aiText || "ChatGPTの結果はまだありません。";
  return buildFinalPrompt(data);
}

function buildFinalPrompt(data) {
  let prompt = "";
  if (state.appliedAiPrompt) {
    prompt = state.appliedAiPrompt;
  } else if (data.promptLanguage === "english") {
    prompt = buildEnglishPrompt(data);
  } else if (data.promptLanguage === "japanese") {
    prompt = buildJapanesePrompt(data);
  } else {
    prompt = buildBilingualPrompt(data);
  }
  return applyPromptMode(prompt, data);
}

function applyPromptMode(prompt, data) {
  return limitPromptToCharacters(prompt, getPromptLimit(data.promptMode));
}

function normalizePromptMode(mode) {
  if (mode === "advanced1000") return "advanced1000";
  return "simple3000";
}

function getPromptLimit(mode) {
  return normalizePromptMode(mode) === "advanced1000" ? 1000 : 3000;
}

function limitPromptToCharacters(prompt, limit) {
  const normalized = String(prompt).replace(/\n{3,}/g, "\n\n").trim();
  if (Array.from(normalized).length <= limit) return normalized;

  const suffix = "\n\nAvoid copying melodies, lyrics, hooks, or artist identity.";
  const suffixLength = Array.from(suffix).length;
  const bodyLimit = Math.max(0, limit - suffixLength);
  const trimmedBody = Array.from(normalized).slice(0, bodyLimit).join("").replace(/\s+\S*$/, "").trimEnd();
  return `${trimmedBody}${suffix}`;
}

function updateOutput() {
  updateRanges();
  updateConditionalFields();
  updateGenreChips();
  updatePromptModeButtons();
  const data = getFormData();
  elements.outputText.value = getOutputForActiveTab(data);
  updatePromptCounter(buildFinalPrompt(data), data);
  elements.applyAiButton.disabled = !state.aiEnhancedPrompt;
  elements.captionGenre.textContent = getGenreLabel(data);
  elements.captionBpm.textContent = `${clampNumber(data.bpm, 40, 220, 112)} BPM`;
  saveState();
  renderHistory();
  drawCover(data);
  drawBrand();
}

function updatePromptCounter(prompt, data) {
  if (!elements.promptCounter) return;
  const count = Array.from(prompt).length;
  const limit = getPromptLimit(data.promptMode);
  elements.promptCounter.textContent = `Suno用: ${count} / ${limit}文字`;
  elements.promptCounter.classList.toggle("is-warn", count > limit * 0.94);
}

function updateRanges() {
  Object.keys(rangeOutputs).forEach((key) => {
    rangeOutputs[key].textContent = fields[key].value;
  });
}

function updateConditionalFields() {
  elements.customGenreField.classList.toggle("is-visible", getSelectedGenres().includes("Custom"));
  const showDraft = state.lyricsMode === "full";
  elements.lyricDraftField.classList.toggle("is-visible", showDraft);
  elements.hookField.style.display = state.lyricsMode === "instrumental" ? "none" : "";
}

function updateGenreChips() {
  const selected = getSelectedGenres();
  document.querySelectorAll("[data-genre-chip]").forEach((button) => {
    const isActive = selected.includes(button.dataset.genreChip);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function toggleGenre(value) {
  const options = Array.from(fields.genre.options);
  const option = options.find((item) => item.value === value);
  if (!option) return;

  const selected = getSelectedGenres();
  if (option.selected && selected.length <= 1) {
    option.selected = true;
  } else {
    option.selected = !option.selected;
  }
}

function updateModeButtons() {
  document.querySelectorAll("[data-lyrics-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lyricsMode === state.lyricsMode);
  });
}

function updatePromptModeButtons() {
  const mode = normalizePromptMode(fields.promptMode.value);
  fields.promptMode.value = mode;
  document.querySelectorAll("[data-prompt-mode]").forEach((button) => {
    const isActive = button.dataset.promptMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll("[data-tab]").forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormData()));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 12)));
}

function drawCover(data) {
  const canvas = elements.coverCanvas;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const seed = hashString(JSON.stringify(data));
  const energy = Number(data.energy);
  const brightness = Number(data.brightness);
  const warmth = Number(data.warmth);
  const complexity = Number(data.complexity);
  const bg = brightness > 6 ? "#f2e7cf" : "#171b20";
  const fg = brightness > 6 ? "#20242a" : "#fffaf0";
  const palette = warmth > 6
    ? ["#b85745", "#b28b2e", "#496f5d", "#246a9b"]
    : ["#246a9b", "#6e4f75", "#496f5d", "#b28b2e"];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 72; i += 1) {
    const x = (i / 72) * width;
    const wave = Math.sin((i + seed % 17) * 0.48) * 0.5 + 0.5;
    const barHeight = 36 + wave * (height * 0.44) * (energy / 10);
    ctx.fillStyle = withAlpha(palette[i % palette.length], 0.18 + (complexity / 10) * 0.2);
    ctx.fillRect(x, height - barHeight, width / 96, barHeight);
  }

  ctx.lineWidth = 2.2;
  for (let band = 0; band < 5; band += 1) {
    ctx.beginPath();
    const color = palette[(band + seed) % palette.length];
    ctx.strokeStyle = withAlpha(color, 0.62);
    for (let x = 0; x <= width; x += 12) {
      const y =
        height * (0.25 + band * 0.12) +
        Math.sin((x / 65) + band + seed * 0.01) * (16 + energy * 2) +
        Math.cos((x / 115) + complexity) * 10;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.93;
  ctx.font = "700 42px Inter, system-ui, sans-serif";
  ctx.textBaseline = "top";
  wrapCanvasText(ctx, data.title || "Untitled song", 44, 36, width * 0.7, 52, 2);

  ctx.globalAlpha = 0.82;
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  wrapCanvasText(ctx, getGenre(), 48, 150, width * 0.55, 32, 2);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = withAlpha(fg, 0.16);
  ctx.strokeRect(24, 24, width - 48, height - 48);
}

function drawBrand() {
  const ctx = elements.brandCanvas.getContext("2d");
  const { width, height } = elements.brandCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#20242a";
  ctx.fillRect(0, 0, width, height);
  ["#246a9b", "#b85745", "#b28b2e", "#496f5d"].forEach((color, index) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const y = 13 + index * 7;
    for (let x = 5; x <= width - 5; x += 3) {
      const wave = Math.sin((x + index * 14) * 0.28) * 4;
      if (x === 5) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  });
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = createCanvasTokens(ctx, text, maxWidth);
  let line = "";
  let currentY = y;
  let lines = 0;

  words.forEach((token, index) => {
    const joiner = line && !token.compact ? " " : "";
    const testLine = line ? `${line}${joiner}${token.text}` : token.text;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      lines += 1;
      line = token.text;
    } else {
      line = testLine;
    }

    if (index === words.length - 1 && lines < maxLines) {
      ctx.fillText(line, x, currentY);
    }
  });
}

function createCanvasTokens(ctx, text, maxWidth) {
  return String(text)
    .trim()
    .split(/\s+/)
    .flatMap((word) => {
      if (ctx.measureText(word).width <= maxWidth) return [{ text: word, compact: false }];
      return Array.from(word).map((character) => ({ text: character, compact: true }));
    });
}

function withAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function setupEvents() {
  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => {
      clearAppliedAiPromptForSongField(field);
      updateOutput();
    });
    field.addEventListener("change", () => {
      clearAppliedAiPromptForSongField(field);
      updateOutput();
    });
  });

  document.querySelectorAll("[data-genre-chip]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleGenre(button.dataset.genreChip);
      updateOutput();
    });
  });

  document.querySelectorAll("[data-lyrics-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.lyricsMode = button.dataset.lyricsMode;
      updateModeButtons();
      updateOutput();
    });
  });

  document.querySelectorAll("[data-prompt-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      fields.promptMode.value = normalizePromptMode(button.dataset.promptMode);
      updateOutput();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
      updateOutput();
    });
  });

  elements.addReferenceButton.addEventListener("click", () => addReference());
  elements.copyButton.addEventListener("click", copyOutput);
  elements.copySunoButton.addEventListener("click", copySunoPrompt);
  elements.aiButton.addEventListener("click", refineWithAI);
  elements.applyAiButton.addEventListener("click", applyAiPrompt);
  elements.testApiButton.addEventListener("click", testApiConnection);
  elements.clearHistoryButton.addEventListener("click", clearHistory);
  elements.sampleButton.addEventListener("click", () => applyFormData(sampleData));
  elements.resetButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    applyFormData(getEmptyData());
  });
  elements.exportButton.addEventListener("click", exportData);
  elements.importInput.addEventListener("change", importData);
  fields.apiBase.addEventListener("change", () => {
    setApiBase(fields.apiBase.value);
    checkApiStatus();
  });
}

function clearAppliedAiPromptForSongField(field) {
  if (
    field === fields.aiMode ||
    field === fields.aiCount ||
    field === fields.aiInstruction ||
    field === fields.promptMode ||
    field === fields.apiBase
  ) {
    return;
  }
  state.appliedAiPrompt = "";
}

function getApiBase() {
  const paramBase = new URLSearchParams(window.location.search).get("api");
  if (paramBase) return paramBase.replace(/\/$/, "");
  const savedBase = localStorage.getItem(API_BASE_KEY);
  if (savedBase) {
    const normalizedSavedBase = savedBase.replace(/\/$/, "");
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(normalizedSavedBase)) {
      localStorage.removeItem(API_BASE_KEY);
      return DEFAULT_API_BASE;
    }
    return normalizedSavedBase;
  }
  return DEFAULT_API_BASE;
}

function setApiBase(value) {
  apiBase = value.trim().replace(/\/$/, "");
  if (apiBase) {
    localStorage.setItem(API_BASE_KEY, apiBase);
  } else {
    localStorage.removeItem(API_BASE_KEY);
  }
  fields.apiBase.value = apiBase;
}

function getApiUrl(path) {
  return `${apiBase}${path}`;
}

async function checkApiStatus() {
  fields.apiBase.value = apiBase;
  setApiStatus("API確認中", "muted");
  elements.apiModel.textContent = "model";
  elements.aiButton.disabled = true;

  if (!apiBase && location.hostname.endsWith("github.io")) {
    state.apiReady = false;
    setApiStatus("API URL未設定", "warn");
    return;
  }

  try {
    const response = await fetch(getApiUrl("/api/health"));
    if (!response.ok) throw new Error("API health check failed");
    const data = await response.json();
    state.apiReady = Boolean(data.hasApiKey);
    elements.apiModel.textContent = data.model || "model";
    elements.aiButton.disabled = !state.apiReady;
    setApiStatus(state.apiReady ? "API接続済み" : "キー未設定", state.apiReady ? "ready" : "warn");
  } catch {
    state.apiReady = false;
    elements.aiButton.disabled = true;
    setApiStatus("API未接続", "warn");
  }
}

function setApiStatus(text, tone) {
  elements.apiStatus.textContent = text;
  elements.apiStatus.className = `api-pill ${tone || ""}`.trim();
}

async function testApiConnection() {
  elements.testApiButton.disabled = true;
  setStatus("API接続を確認しています");

  try {
    const response = await fetch(getApiUrl("/api/test"), { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "API接続テストに失敗しました");
    }

    state.apiReady = true;
    elements.aiButton.disabled = false;
    elements.apiModel.textContent = result.model || elements.apiModel.textContent;
    setApiStatus("API接続済み", "ready");
    setStatus("API接続テストに成功しました");
  } catch (error) {
    state.apiReady = false;
    elements.aiButton.disabled = true;
    setApiStatus("API確認失敗", "warn");
    setStatus(error.message || "API接続テストに失敗しました");
  } finally {
    elements.testApiButton.disabled = false;
  }
}

async function refineWithAI() {
  const data = getFormData();
  const currentPrompt = buildFinalPrompt(data);
  setAiBusy(true);
  setStatus("ChatGPTで考えています");

  try {
    const response = await fetch(getApiUrl("/api/refine"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: data,
        currentPrompt,
        aiMode: data.aiMode,
        aiCount: data.aiCount,
        aiInstruction: data.aiInstruction,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "ChatGPT連携に失敗しました");
    }

    state.aiEnhancedPrompt = result.enhancedPrompt || "";
    state.aiVariations = Array.isArray(result.variations) ? result.variations : [];
    state.aiText = formatAiResult(result);
    addHistoryItem(result, data);
    setActiveTab("ai");
    updateOutput();
    setStatus("AI結果を作成しました");
  } catch (error) {
    setStatus(error.message || "ChatGPT連携に失敗しました");
  } finally {
    setAiBusy(false);
  }
}

function applyAiPrompt() {
  if (!state.aiEnhancedPrompt) return;
  state.appliedAiPrompt = state.aiEnhancedPrompt;
  setActiveTab("final");
  updateOutput();
  setStatus("AIプロンプトをSuno欄に反映しました");
}

function addHistoryItem(result, data) {
  const prompt = result.enhancedPrompt || state.aiVariations[0]?.prompt || "";
  if (!prompt) return;

  state.history.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    title: data.title || "Untitled song",
    mode: data.aiMode,
    prompt,
    text: formatAiResult(result),
  });
  state.history = state.history.slice(0, 12);
  saveHistory();
}

function renderHistory() {
  if (!elements.historyList) return;
  elements.historyList.innerHTML = "";

  if (!state.history.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "まだ履歴はありません。";
    elements.historyList.appendChild(empty);
    return;
  }

  state.history.forEach((item) => {
    const row = document.createElement("article");
    row.className = "history-item";

    const meta = document.createElement("button");
    meta.className = "history-main";
    meta.type = "button";
    meta.innerHTML = `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(formatHistoryMeta(item))}</span>`;
    meta.addEventListener("click", () => restoreHistoryItem(item));

    const useButton = document.createElement("button");
    useButton.className = "text-button";
    useButton.type = "button";
    useButton.textContent = "反映";
    useButton.addEventListener("click", () => restoreHistoryItem(item));

    row.append(meta, useButton);
    elements.historyList.appendChild(row);
  });
}

function restoreHistoryItem(item) {
  state.aiEnhancedPrompt = item.prompt;
  state.aiText = item.text || `AI SUNO PROMPT\n${item.prompt}`;
  setActiveTab("ai");
  updateOutput();
  setStatus("履歴を開きました");
}

function clearHistory() {
  state.history = [];
  saveHistory();
  renderHistory();
  setStatus("AI履歴を消去しました");
}

function formatHistoryMeta(item) {
  const date = new Date(item.createdAt);
  const dateText = Number.isNaN(date.getTime())
    ? ""
    : `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return [translateAiMode(item.mode), dateText].filter(Boolean).join(" / ");
}

function translateAiMode(mode) {
  const map = {
    refine: "完成プロンプト",
    ideate: "方向性",
    lyrics: "歌詞",
    arrange: "編曲",
  };
  return map[mode] || mode;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function setAiBusy(isBusy) {
  elements.aiButton.disabled = isBusy || !state.apiReady;
  elements.aiButton.textContent = isBusy ? "作成中" : "ChatGPTで作る";
}

function formatAiResult(result) {
  const sections = [];

  if (result.enhancedPrompt) {
    sections.push(`AI SUNO PROMPT\n${result.enhancedPrompt}`);
  }

  if (Array.isArray(result.variations) && result.variations.length) {
    sections.push(
      `VARIATIONS\n${result.variations
        .map((variation, index) => {
          const label = variation.label || `Variation ${index + 1}`;
          return `## ${label}\n${variation.prompt || ""}`;
        })
        .join("\n\n")}`,
    );
  }

  if (result.stylePrompt) {
    sections.push(`STYLE PROMPT\n${result.stylePrompt}`);
  }

  if (result.lyricPrompt) {
    sections.push(`LYRIC PROMPT\n${result.lyricPrompt}`);
  }

  if (Array.isArray(result.ideas) && result.ideas.length) {
    sections.push(`IDEAS\n${result.ideas.map((idea) => `- ${idea}`).join("\n")}`);
  }

  if (Array.isArray(result.cautions) && result.cautions.length) {
    sections.push(`CAUTIONS\n${result.cautions.map((caution) => `- ${caution}`).join("\n")}`);
  }

  return sections.join("\n\n").trim() || "AI結果が空でした。";
}

async function copyOutput() {
  const text = elements.outputText.value;
  await copyText(text, "コピーしました");
}

async function copySunoPrompt() {
  const data = getFormData();
  const text = applyPromptMode(state.aiEnhancedPrompt || buildFinalPrompt(data), data);
  await copyText(text, "Suno用プロンプトをコピーしました");
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(message);
  } catch {
    elements.outputText.value = text;
    elements.outputText.select();
    document.execCommand("copy");
    setStatus(message);
  }
}

function setStatus(message) {
  elements.copyStatus.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    elements.copyStatus.textContent = "";
  }, 2200);
}

function exportData() {
  const blob = new Blob([JSON.stringify(getFormData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const title = fields.title.value.trim().replace(/[^\w-]+/g, "-") || "suno-prompt";
  anchor.href = url;
  anchor.download = `${title}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("保存ファイルを作成しました");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(String(reader.result));
      applyFormData(data);
      setStatus("読み込みました");
    } catch {
      setStatus("読み込みに失敗しました");
    } finally {
      elements.importInput.value = "";
    }
  });
  reader.readAsText(file);
}

function boot() {
  setupEvents();
  state.history = loadHistory();
  const saved = loadState();
  if (saved) {
    applyFormData(saved);
  } else {
    applyFormData(getEmptyData());
  }
  checkApiStatus();
}

boot();
