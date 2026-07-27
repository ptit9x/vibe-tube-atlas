import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type ThemeColor = "zinc" | "blue" | "green" | "orange" | "rose" | "violet"
export type Mode = "light" | "dark" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: ThemeColor
    defaultMode?: Mode
    storageKey?: string
    modeStorageKey?: string
}

type ThemeProviderState = {
    theme: ThemeColor
    mode: Mode
    resolvedMode: "light" | "dark"
    setTheme: (theme: ThemeColor) => void
    setMode: (mode: Mode) => void
    toggleMode: () => void
}

const initialState: ThemeProviderState = {
    theme: "zinc",
    mode: "system",
    resolvedMode: "light",
    setTheme: () => null,
    setMode: () => null,
    toggleMode: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function getSystemMode(): "light" | "dark" {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
    children,
    defaultTheme = "zinc",
    defaultMode = "system",
    storageKey = "vibe-tube-atlas-theme",
    modeStorageKey = "vibe-tube-atlas-mode",
    ...props
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<ThemeColor>(
        () => (localStorage.getItem(storageKey) as ThemeColor) || defaultTheme
    )
    const [mode, setModeState] = useState<Mode>(
        () => (localStorage.getItem(modeStorageKey) as Mode) || defaultMode
    )
    const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() => {
        const saved = localStorage.getItem(modeStorageKey) as Mode | null
        if (saved === "system" || !saved) return getSystemMode()
        return saved
    })

    // Apply theme classes
    useEffect(() => {
        const root = window.document.documentElement

        // Color theme
        root.classList.remove("theme-zinc", "theme-blue", "theme-green", "theme-orange", "theme-rose", "theme-violet")
        if (theme !== "zinc") {
            root.classList.add(`theme-${theme}`)
        }
    }, [theme])

    // Apply dark/light mode
    useEffect(() => {
        const root = window.document.documentElement

        const resolve = () => {
            const resolved = mode === "system" ? getSystemMode() : mode
            setResolvedMode(resolved)

            if (resolved === "dark") {
                root.classList.add("dark")
            } else {
                root.classList.remove("dark")
            }
        }

        resolve()

        // Listen for system changes when mode is "system"
        if (mode === "system") {
            const mq = window.matchMedia("(prefers-color-scheme: dark)")
            const handler = () => resolve()
            mq.addEventListener("change", handler)
            return () => mq.removeEventListener("change", handler)
        }
    }, [mode])

    const setTheme = useCallback((t: ThemeColor) => {
        localStorage.setItem(storageKey, t)
        setThemeState(t)
    }, [storageKey])

    const setMode = useCallback((m: Mode) => {
        localStorage.setItem(modeStorageKey, m)
        setModeState(m)
    }, [modeStorageKey])

    const toggleMode = useCallback(() => {
        setMode(resolvedMode === "dark" ? "light" : "dark")
    }, [resolvedMode, setMode])

    const value = useMemo(() => ({ theme, mode, resolvedMode, setTheme, setMode, toggleMode }), [theme, mode, resolvedMode, setTheme, setMode, toggleMode])

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
