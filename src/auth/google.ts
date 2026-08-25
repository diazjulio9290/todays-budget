export const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

const AUTH_KEY = "todays-budget:auth";
const GIS_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
            context?: "signin" | "signup" | "use";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              logo_alignment?: "left" | "center";
            },
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function googleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function loadAuth(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleProfile;
    if (!parsed.sub || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(profile: GoogleProfile | null): void {
  if (!profile) {
    localStorage.removeItem(AUTH_KEY);
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
}

export function decodeCredential(jwt: string): GoogleProfile {
  const part = jwt.split(".")[1];
  if (!part) throw new Error("Invalid Google credential");
  const json = decodeBase64Url(part);
  const payload = JSON.parse(json) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
    exp?: number;
  };
  if (GOOGLE_CLIENT_ID && payload.aud && payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google credential was issued for a different app");
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error("Google credential expired — try again");
  }
  if (!payload.sub || !payload.email) {
    throw new Error("Google credential was missing email");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || "",
  };
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

let gisLoading: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Google sign-in")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Could not load Google sign-in"));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

export async function renderGoogleButton(
  parent: HTMLElement,
  onUser: (profile: GoogleProfile) => void,
  onError: (message: string) => void,
): Promise<void> {
  if (!googleConfigured()) {
    onError("Add VITE_GOOGLE_CLIENT_ID to .env, then restart the dev server.");
    return;
  }
  await loadGoogleScript();
  const gis = window.google?.accounts?.id;
  if (!gis) throw new Error("Google sign-in did not initialize");
  parent.replaceChildren();
  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      try {
        onUser(decodeCredential(response.credential));
      } catch (err) {
        onError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    },
    ux_mode: "popup",
    context: "signin",
  });
  gis.renderButton(parent, {
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "pill",
    width: Math.min(320, Math.floor(parent.clientWidth || 280)),
  });
}

export function disableGoogleAutoSelect(): void {
  window.google?.accounts?.id.disableAutoSelect();
}
