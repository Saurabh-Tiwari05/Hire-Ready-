import { create } from "zustand";

const musicPref = () => {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("hr-music") === "1";
  } catch {
    return false;
  }
};

export const useAppStore = create((set) => ({
  loaded: false,
  setLoaded: (v) => set({ loaded: v }),

  music: musicPref(),
  toggleMusic: () =>
    set((s) => {
      const v = !s.music;
      try {
        localStorage.setItem("hr-music", v ? "1" : "0");
      } catch {}
      return { music: v };
    }),
}));
