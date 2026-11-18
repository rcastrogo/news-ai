"use client";

import { Palette, Dices, Sun, Moon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils";

export const PALETTES = ["indigo", "red", "blue", "green", "gray", "yellow", "summer", "winter"] as const;
export type Palette = (typeof PALETTES)[number] | null;
export type Mode = "light" | "dark";

const PALETTE_KEY = "palette";
const MODE_KEY = "mode";
const CUSTOM_KEY = "customPalette";
const IS_CUSTOM_KEY = "custom"

export type PaletteVars = Partial<{
  huePrimary: number;
  hueAccent: number;
  hueNeutral: number;
  chromaPrimary: number;
  chromaAccent: number;
  chromaNeutral: number;
  lightnessPrimary: number;
  lightnessPrimaryDark: number;
}>;

const VAR_NAMES: Record<keyof PaletteVars, string> = {
  huePrimary: "--hue-primary",
  hueAccent: "--hue-accent",
  hueNeutral: "--hue-neutral",
  chromaPrimary: "--chroma-primary",
  chromaAccent: "--chroma-accent",
  chromaNeutral: "--chroma-neutral",
  lightnessPrimary: "--lightness-primary",
  lightnessPrimaryDark: "--lightness-primary-dark",
};


export const themeInitScript = `
(function () {
  try {
    var root = document.documentElement;

    // Valores guardados por el usuario
    var savedPalette  = localStorage.getItem("${PALETTE_KEY}");
    var savedMode     = localStorage.getItem("${MODE_KEY}");
    var savedCustom   = localStorage.getItem("${CUSTOM_KEY}");
    var isCustomTheme = localStorage.getItem("${IS_CUSTOM_KEY}") === "true";

    var cssVarNames = ${JSON.stringify(VAR_NAMES)};

    if (savedPalette && savedPalette !== "indigo") {
      root.dataset.theme = savedPalette;
    }

    if (savedCustom && isCustomTheme) {
      var customColors = JSON.parse(savedCustom);

      for (var key in customColors) {
        var cssVarName = cssVarNames[key];
        if (cssVarName) {
          root.style.setProperty(cssVarName, String(customColors[key]));
        }
      }
    }

    var systemPrefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    var useDarkMode = savedMode === "dark" || (!savedMode && systemPrefersDark);

    if (useDarkMode) {
      root.classList.add("dark");
    }
  } catch (error) {
  }
})();
`;

export function setCustomPalette(vars: PaletteVars): void {
  const style = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) {
    style.setProperty(VAR_NAMES[key as keyof PaletteVars], String(value));
  }
}

export function clearCustomPalette(): void {
  const style = document.documentElement.style;
  for (const name of Object.values(VAR_NAMES)) style.removeProperty(name);
}

/* ----------------------------------------------------------------------------
   Generador de paletas aleatorias "visibles"
   Aleatorio, pero acotado para que el resultado siempre sea legible y armónico:
   - Claridad del primario en modo claro ≤ 0.55 → el texto blanco de los botones
     mantiene contraste suficiente (~AA).
   - Claridad en modo oscuro 0.72-0.82 → destaca sobre el fondo oscuro.
   - Saturación moderada (y reducida en amarillos/verdes lima, donde sRGB tiene
     poco margen y el color se vuelve sucio).
   - El acento se separa del primario por un desfase armónico (análogo,
     split-complementario o complementario), nunca el mismo tono.
   - Los fondos y grises toman un tinte cercano al primario.
---------------------------------------------------------------------------- */
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const round = (n: number, decimals = 2) => Number(n.toFixed(decimals));
const wrapHue = (h: number) => Math.round(((h % 360) + 360) % 360);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Chroma máximo razonable según el tono (zona amarillo/lima = poco margen de gamut). */
const chromaCap = (hue: number) => (hue >= 80 && hue <= 140 ? 0.12 : 0.18);
const HARMONIC_OFFSETS = [30, 150, 180, 210, 330] as const;

export function generateRandomPalette(): Required<PaletteVars> {
  const huePrimary = wrapHue(rand(0, 360));
  const hueAccent = wrapHue(huePrimary + pick(HARMONIC_OFFSETS) + rand(-8, 8));
  const hueNeutral = wrapHue(huePrimary + rand(-20, 20));

  return {
    huePrimary,
    hueAccent,
    hueNeutral,
    chromaPrimary: round(Math.min(rand(0.12, 0.19), chromaCap(huePrimary))),
    chromaAccent: round(Math.min(rand(0.1, 0.16), chromaCap(hueAccent))),
    chromaNeutral: round(rand(0.01, 0.03), 3),
    lightnessPrimary: round(rand(0.48, 0.55)),
    lightnessPrimaryDark: round(rand(0.72, 0.82)),
  };
}

/* ----------------------------------------------------------------------------
   Provider + hook
---------------------------------------------------------------------------- */
type ThemeContextValue = {
  palette: Palette;
  mode: Mode;
  isCustom: boolean;
  setPalette: (p: Palette) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  randomizePalette: () => PaletteVars;
  setCustomMode: () => void
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function safeSave(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(null);
  const [mode, setModeState] = useState<Mode>(null);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    const current = d.dataset.theme as Palette | undefined;
    setPaletteState(current && PALETTES.includes(current) ? current : "indigo");
    setModeState(d.classList.contains("dark") ? "dark" : "light");
    setIsCustom(d.style.getPropertyValue(VAR_NAMES.huePrimary) !== "");
  }, []);

  const setPalette = useCallback((p: Palette) => {
    const d = document.documentElement;
    clearCustomPalette();
    if (p === "indigo") delete d.dataset.theme;
    else d.dataset.theme = p;
    safeSave(PALETTE_KEY, p);
    setPaletteState(p);
    setIsCustom(false);
    safeSave(IS_CUSTOM_KEY, 'false');
  }, []);

  const randomizePalette = useCallback(() => {
    const vars = generateRandomPalette();
    setCustomPalette(vars);
    safeSave(CUSTOM_KEY, JSON.stringify(vars));
    safeSave(IS_CUSTOM_KEY, 'true');
    setIsCustom(true);
    return vars;
  }, []);

  const setCustomMode = useCallback(() => {
    var palette = localStorage.getItem(CUSTOM_KEY);
    if(palette) {
      const vars = JSON.parse(palette);
      setCustomPalette(vars);
      safeSave(IS_CUSTOM_KEY, 'true');
      setIsCustom(true);     
    }
  }, []);

  const setMode = useCallback((m: Mode) => {
    const root = document.documentElement;
    const css = document.createElement("style");
    css.appendChild(
      document.createTextNode(`
        *,
        *::before,
        *::after {
          transition: none !important;
        }
      `)
    );
    document.head.appendChild(css);
    root.classList.toggle("dark", m === "dark");
    safeSave(MODE_KEY, m);
    setModeState(m);
    void window.getComputedStyle(root).opacity;
    document.head.removeChild(css);
  }, []);

  const toggleMode = useCallback(
    () => setMode(mode === "dark" ? "light" : "dark"),
    [mode, setMode],
  );

  const value = useMemo(
    () => ({ palette, mode, isCustom, setPalette, setMode, toggleMode, randomizePalette, setCustomMode }),
    [palette, mode, isCustom, setPalette, setMode, toggleMode, randomizePalette, setCustomMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}

const pill =
  "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap " +
  "transition-all duration-300 ease-out outline-none " +
  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "active:scale-95";

const pillActive =
  "bg-primary text-primary-foreground shadow-md";
const pillIdle =
  "text-muted-foreground hover:bg-accent hover:text-accent-foreground";


export function PaletteSwitcher() {
  const { palette, isCustom, setPalette, randomizePalette, setCustomMode, mode, toggleMode } = useTheme();
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-3 sm:flex-row sm:gap-4">
      <div
        role="group"
        aria-label="Paleta de color"
        className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-3xl border border-border bg-card/70 p-1.5 shadow-sm backdrop-blur sm:rounded-full"
      >
        {PALETTES.map((p) => {
          const isActive = !isCustom && palette === p;
          return (
            <button
              key={p}
              onClick={() => setPalette(p)}
              aria-pressed={isActive}
              className={`${pill} ${isActive ? pillActive : pillIdle}`}
            >
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full transition-all duration-300 ${isActive ? "scale-100 bg-primary-foreground" : "scale-75 bg-current opacity-40"}`}
              />
              <span className="capitalize">{p}</span>
            </button>
          );
        })}
        <button
          onClick={() => setCustomMode()}
          aria-pressed={isCustom}
          className={`${pill} group ${isCustom ? pillActive : pillIdle}`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full transition-all duration-300 ${isCustom ? "scale-100 bg-primary-foreground" : "scale-75 bg-current opacity-40"}`}
          />
          <span>Custom</span>
        </button>
        <button
          onClick={() => randomizePalette()}
          aria-pressed={isCustom}
          className={cn([pill, "group"])}
        >
          <Dices className="h-4 w-4 transition-transform duration-500 group-hover:rotate-360 group-active:rotate-720" />
        </button>
      </div>

      <button
        onClick={toggleMode}
        role="switch"
        aria-checked={mode === "dark"}
        aria-label="Cambiar modo de apariencia"
        className="group relative flex h-10 w-18 shrink-0 items-center rounded-full border border-border bg-card/70 p-1 shadow-sm backdrop-blur outline-none transition-colors duration-300 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Sun className="absolute left-2.5 h-4 w-4 text-amber-400" aria-hidden />
        <Moon className="absolute right-2.5 h-4 w-4 text-indigo-400" aria-hidden />
        {mode &&
          <span
            aria-hidden
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-300 ease-out group-active:scale-90 ${mode === "dark" ? "translate-x-8" : "translate-x-0"
              }`}
          >
            {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>
        }
      </button>
    </div>
  );
}
