import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Global styles (themes, purple outlines, faded logo background)
 * This gets injected once into <head> when the app mounts.
 */
const GLOBAL_STYLES = `
:root {
  --bg-color: #ffffff;
  --panel-bg: #ffffff;
  --text-color: #111827;
  --muted-text: #6b7280;

  --accent: #7d4aea;               /* main purple */
  --accent-strong: #6a39df;
  --accent-soft: rgba(125, 74, 234, 0.12);

  --border-subtle: #e5e7eb;
  --border-strong: #d1d5db;

  --input-bg: #f9fafb;
  --chip-bg: #f3f4f6;

  /* all logos, used as default watermark */
  --chat-bg-image: url("/logos/kolbys-ai-avatar.png"),
                   url("/logos/mountains-to-sea.png"),
                   url("/logos/changing-tides.png");
}

/* Beach theme (Changing Tides) */
[data-theme="beach"] {
  --bg-color: #fdf7ec;             /* sand */
  --panel-bg: #fefaf3;
  --accent: #2f80ed;               /* ocean */
  --accent-strong: #2563eb;
  --accent-soft: rgba(47, 128, 237, 0.12);
  --chat-bg-image: url("/logos/changing-tides.png"),
                   url("/logos/kolbys-ai-avatar.png"),
                   url("/logos/mountains-to-sea.png");
}

/* Mountain theme (Mountains to Sea) */
[data-theme="mountain"] {
  --bg-color: #f4f8fc;
  --panel-bg: #f7fafc;
  --accent: #1b3a61;               /* navy */
  --accent-strong: #142947;
  --accent-soft: rgba(27, 58, 97, 0.13);
  --chat-bg-image: url("/logos/mountains-to-sea.png"),
                   url("/logos/kolbys-ai-avatar.png"),
                   url("/logos/changing-tides.png");
}

/* -------- purple outlines / focus states ---------- */

button,
select,
textarea {
  border-radius: 0.5rem;
}

button:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* -------- chat watermark (all logos, faded) -------- */

.chat-panel {
  position: relative;
  overflow: hidden;
}

.chat-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--chat-bg-image);
  background-repeat: no-repeat;
  background-size: 180px auto, 200px auto, 170px auto;
  background-position:
    top 8% left 6%,
    center,
    bottom 8% right 8%;
  opacity: 0.045;                  /* adjust for stronger/weaker logos */
  pointer-events: none;
  z-index: 0;
}

/* ensure content sits above watermark */
.chat-panel > * {
  position: relative;
  z-index: 1;
}
`;

function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  const id = "kolbys-ai-global-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = GLOBAL_STYLES;
  document.head.appendChild(style);
}

type ThemeName = "light" | "beach" | "mountain";

const themes: Record<string, ThemeName> = {
  "kolbys-ai-beta": "light",
  "kolbys-ai-alpha": "light",
  "changing-tides-proposal": "beach",
  "mountains-to-sea-therapy": "mountain",
};

type ModelConfig = {
  id: string;
  label: string;
  subtitle: string;
  logo: string;
};

const models: ModelConfig[] = [
  {
    id: "kolbys-ai-beta",
    label: "Kolby’s AI (Beta)",
    subtitle: "General assistant · purple + gold",
    logo: "/logos/kolbys-ai-main.png",
  },
  {
    id: "kolbys-ai-alpha",
    label: "Kolby’s AI (Alpha)",
    subtitle: "Experimental build",
    logo: "/logos/kolbys-ai-avatar.png",
  },
  {
    id: "changing-tides-proposal",
    label: "Changing Tides Proposal",
    subtitle: "Proposal generator",
    logo: "/logos/changing-tides.png",
  },
  {
    id: "mountains-to-sea-therapy",
    label: "Mountains to Sea Therapy",
    subtitle: "Clinical / admin assistant",
    logo: "/logos/mountains-to-sea.png",
  },
];

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function App() {
  const [modelId, setModelId] = useState<string>("kolbys-ai-beta");
  const [theme, setTheme] = useState<ThemeName>("light");
  const [spicyMode, setSpicyMode] = useState(false);
  const [originMode, setOriginMode] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "Welcome aboard. This is Kolby's Custom Built Artificial Intelligence Software.",
    },
  ]);

  // inject CSS once
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // theme switching
  useEffect(() => {
    const activeTheme = themes[modelId] || "light";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
    setTheme(activeTheme);
  }, [modelId]);

  const activeModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? models[0],
    [modelId]
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;

    const userMessage: Message = {
      id: nextId,
      role: "user",
      text: trimmed,
    };

    // front-end placeholder reply
    const assistantMessage: Message = {
      id: nextId + 1,
      role: "assistant",
      text:
        "This is a placeholder reply from the UI layer.\n\n" +
        "👉 TODO: wire this send handler into your existing backend call " +
        "and stream the real response here.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[var(--border-subtle)] bg-[var(--panel-bg)]">
        <div className="px-4 pt-4 pb-3 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/90 border border-[var(--accent-soft)] flex items-center justify-center overflow-hidden">
            <img
              src={activeModel.logo}
              alt={activeModel.label}
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[0.7rem] uppercase tracking-wide text-[var(--muted-text)]">
              Active model
            </div>
            <div className="font-semibold truncate">{activeModel.label}</div>
            <div className="text-xs text-[var(--muted-text)] truncate">
              {activeModel.subtitle}
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-[var(--muted-text)]">
              Model
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-color)]"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              onClick={() => setSpicyMode((prev) => !prev)}
            >
              <span>Spicy Mode</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-soft)]">
                {spicyMode ? "On" : "Off"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-[var(--border-strong)]"
              onClick={() => setOriginMode((prev) => !prev)}
            >
              <span>Origin Story</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--chip-bg)]">
                {originMode ? "On" : "Off"}
              </span>
            </Button>
          </div>

          <Button className="w-full mt-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white">
            + New chat
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--panel-bg)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/90 border border-[var(--accent-soft)] flex items-center justify-center overflow-hidden md:hidden">
              <img
                src={activeModel.logo}
                alt={activeModel.label}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--muted-text)]">
                Kolby's Custom Built Artificial Intelligence Software
              </div>
              <div className="font-semibold text-sm sm:text-base">
                {activeModel.label}
              </div>
            </div>
          </div>

          {/* Model dropdown (mobile) */}
          <div className="md:hidden">
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-2 py-1 text-xs"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Chat panel with faded logos */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="chat-panel rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-4 max-w-4xl mx-auto">
            <div className="relative z-10 flex flex-col gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--chip-bg)] px-3 py-1 text-[0.7rem] text-[var(--muted-text)] self-start">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                <span>
                  Theme: <strong>{theme}</strong> · Spicy:{" "}
                  {spicyMode ? "On" : "Off"} · Origin:{" "}
                  {originMode ? "On" : "Off"}
                </span>
              </div>

              {/* Message list */}
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      "flex " +
                      (m.role === "user" ? "justify-end" : "justify-start")
                    }
                  >
                    <div
                      className={
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap " +
                        (m.role === "user"
                          ? "bg-[var(--accent-soft)] text-[var(--text-color)] border border-[var(--accent)]"
                          : "bg-white/85 border border-[var(--border-subtle)]")
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Input bar */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-3">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-color)]"
            />
            <Button
              type="button"
              onClick={handleSend}
              className="shrink-0 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white px-4"
            >
              Send
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
