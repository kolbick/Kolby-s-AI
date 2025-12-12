import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

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
  --chat-bg-image: url("/logos/kolbys-ai-main.png");
}

/* Beach theme (Changing Tides) */
[data-theme="beach"] {
  --bg-color: #fdf7ec;             /* sand */
  --panel-bg: #fefaf3;
  --accent: #2f80ed;               /* ocean */
  --accent-strong: #2563eb;
  --accent-soft: rgba(47, 128, 237, 0.12);
}

/* Mountain theme (Mountains to Sea) */
[data-theme="mountain"] {
  --bg-color: #f4f8fc;
  --panel-bg: #f7fafc;
  --accent: #1b3a61;               /* navy */
  --accent-strong: #142947;
  --accent-soft: rgba(27, 58, 97, 0.13);
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

/* -------- chat watermark (single logo, faded) -------- */

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
  background-size: 520px auto;
  background-position: center;
  opacity: 0.05;
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
  logo: string;
};

const models: ModelConfig[] = [
  {
    id: "kolbys-ai-beta",
    label: "Kolby’s AI (Beta)",
    logo: "/logos/kolbys-ai-main.png",
  },
  {
    id: "kolbys-ai-alpha",
    label: "Kolby’s AI (Alpha)",
    logo: "/logos/kolbys-ai-avatar.png",
  },
  {
    id: "changing-tides-proposal",
    label: "Notes (Beta)",
    logo: "/logos/changing-tides.png",
  },
  {
    id: "mountains-to-sea-therapy",
    label: "Mountains to Sea Therapy",
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
  const [spicyMode, setSpicyMode] = useState(false);
  const [originMode, setOriginMode] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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
  }, [modelId]);

  const activeModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? models[0],
    [modelId]
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--chat-bg-image",
        `url("${activeModel.logo}")`
      );
    }
  }, [activeModel.logo]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;

    const userMessage: Message = {
      id: nextId,
      role: "user",
      text: trimmed,
    };

    const assistantMessage: Message = {
      id: nextId + 1,
      role: "assistant",
      text: "…",
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
            <div className="font-semibold truncate">{activeModel.label}</div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-color)]"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-[var(--border-subtle)] text-[var(--text-color)] hover:bg-[var(--accent-soft)]"
              onClick={() => setSpicyMode((prev) => !prev)}
            >
              <span>Spicy Mode</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--chip-bg)]">
                {spicyMode ? "On" : "Off"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-[var(--border-subtle)] text-[var(--text-color)] hover:bg-[var(--accent-soft)]"
              onClick={() => setOriginMode((prev) => !prev)}
            >
              <span>Origin Story</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--chip-bg)]">
                {originMode ? "On" : "Off"}
              </span>
            </Button>
          </div>

          <Button className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white">
            New chat
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
              <h1 className="text-sm sm:text-base font-semibold leading-tight">
                Kolby’s Custom Built Artificial Intelligence Software
              </h1>
              <div className="text-xs text-[var(--muted-text)]">{activeModel.label}</div>
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  className={`rounded-xl border transition shadow-sm ${
                    m.id === modelId
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border-subtle)] bg-[var(--panel-bg)]"
                  }`}
                >
                  <div className="aspect-square flex items-center justify-center p-3">
                    <img
                      src={m.logo}
                      alt={m.label}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <div className="border-t border-[var(--border-subtle)] text-center text-xs font-medium px-2 py-2">
                    {m.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="chat-panel rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-4">
              <div className="relative z-10 flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-xs border-[var(--border-subtle)] bg-[var(--panel-bg)] hover:bg-[var(--accent-soft)]"
                    onClick={() => setSpicyMode((prev) => !prev)}
                  >
                    Spicy Mode: {spicyMode ? "On" : "Off"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-xs border-[var(--border-subtle)] bg-[var(--panel-bg)] hover:bg-[var(--accent-soft)]"
                    onClick={() => setOriginMode((prev) => !prev)}
                  >
                    Origin Story: {originMode ? "On" : "Off"}
                  </Button>
                </div>

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
              placeholder="Message"
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
