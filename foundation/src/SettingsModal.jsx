import React, { useEffect, useRef, useState } from "react";
import { AudioLines, Moon, Settings, Trash2, X } from "lucide-react";

const AUDIO_SPEED_KEY = "apex-tts-playback-rate";
const DARK_MODE_KEY = "apex-dark-mode";
const AUDIO_SPEED_OPTIONS = ["0.75", "1", "1.25"];

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export default function SettingsModal({ isOpen, onClose, onClearChat }) {
  const [audioSpeed, setAudioSpeed] = useState(() => {
    const saved = readStoredValue(AUDIO_SPEED_KEY, "1");
    return AUDIO_SPEED_OPTIONS.includes(saved) ? saved : "1";
  });
  const [darkMode, setDarkMode] = useState(() => readStoredValue(DARK_MODE_KEY, "false") === "true");
  const [clearNotice, setClearNotice] = useState("");
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIO_SPEED_KEY, audioSpeed);
    } catch {
      // The in-memory setting still works when storage is unavailable.
    }
  }, [audioSpeed]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    } catch {
      // Theme preference is a placeholder; keep the toggle usable without storage.
    }
  }, [darkMode]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const activeElement = document.activeElement;
    previousFocusRef.current = activeElement?.closest?.("#mobile-study-drawer")
      ? document.querySelector("[aria-label='Open settings']") || activeElement
      : activeElement;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll(
        "[data-settings-dialog] button:not([disabled]), [data-settings-dialog] select:not([disabled]), [data-settings-dialog] input:not([disabled]), [data-settings-dialog] [tabindex='0']"
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const clearHistory = () => {
    onClearChat?.();
    setClearNotice("Copilot chat history cleared.");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        data-settings-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-description"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Settings size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 id="settings-title" className="text-lg font-extrabold tracking-tight text-gray-950">Settings</h2>
              <p id="settings-description" className="mt-1 text-sm leading-5 text-gray-500">Personalize your APEX study experience.</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-95"
            aria-label="Close settings"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <section className="rounded-xl border border-gray-100 bg-gray-50 p-4" aria-labelledby="audio-speed-heading">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-blue-600"><AudioLines size={18} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <label id="audio-speed-heading" htmlFor="audio-speed" className="block text-sm font-bold text-gray-900">Audio speed</label>
                <p className="mt-1 text-xs leading-5 text-gray-500">Adjust the playback rate for Gemini Read Aloud.</p>
                <select
                  id="audio-speed"
                  value={audioSpeed}
                  onChange={(event) => setAudioSpeed(event.target.value)}
                  className="mt-3 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="0.75">0.75× — slower</option>
                  <option value="1">1× — normal</option>
                  <option value="1.25">1.25× — faster</option>
                </select>
                <p className="mt-2 text-[11px] text-gray-400">Saved on this device. Applies to the next Read Aloud playback.</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4" aria-labelledby="dark-mode-heading">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-gray-500"><Moon size={18} aria-hidden="true" /></span>
              <div>
                <h3 id="dark-mode-heading" className="text-sm font-bold text-gray-900">Dark Mode</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">Preference toggle — full dark theme is coming later.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle Dark Mode"
              onClick={() => setDarkMode((value) => !value)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 shadow-inner transition active:scale-95 ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </section>

          <section className="rounded-xl border border-red-100 bg-red-50/70 p-4" aria-labelledby="clear-chat-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 id="clear-chat-heading" className="text-sm font-bold text-gray-900">Clear Chat History</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">Remove the Copilot conversation from this session.</p>
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
              >
                <Trash2 size={16} aria-hidden="true" /> Clear history
              </button>
            </div>
            {clearNotice && <p className="mt-3 text-xs font-medium text-emerald-700" role="status">{clearNotice}</p>}
          </section>
        </div>

        <footer className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 active:scale-95"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}
