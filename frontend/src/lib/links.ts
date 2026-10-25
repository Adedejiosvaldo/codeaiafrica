import type { Week } from "./types";

// Where the browser lab (JupyterLite) is published. Same site by default (/lab/).
const LAB_URL = (import.meta.env.VITE_LAB_URL as string | undefined) ?? "/lab";
// GitHub repo holding the kaggle/ notebooks, used for "Open in Colab" links.
const NOTEBOOK_REPO = (import.meta.env.VITE_NOTEBOOK_REPO as string | undefined) ?? "Adedejiosvaldo/codeaiafrica";

export function labLink(week: Week): { href: string; label: string } | null {
  if (week.week === 1) return { href: "/try", label: "Open the 10-minute guide" };
  if (!week.notebook) return null;
  if (week.week <= 5) {
    return { href: `${LAB_URL}/lab/index.html?path=${encodeURIComponent(week.notebook)}`, label: "Open in browser lab" };
  }
  return {
    href: `https://colab.research.google.com/github/${NOTEBOOK_REPO}/blob/main/kaggle/${week.notebook}`,
    label: "Open in Colab",
  };
}
