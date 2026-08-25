import { useEffect, useRef, useState } from "react";
import {
  googleConfigured,
  renderGoogleButton,
  type GoogleProfile,
} from "../auth/google";

export function GoogleButton({
  onSignedIn,
}: {
  onSignedIn: (profile: GoogleProfile) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const onSignedInRef = useRef(onSignedIn);
  const [error, setError] = useState<string | null>(null);
  onSignedInRef.current = onSignedIn;

  useEffect(() => {
    if (!googleConfigured() || !host.current) return;
    let cancelled = false;
    void renderGoogleButton(
      host.current,
      (profile) => {
        if (!cancelled) onSignedInRef.current(profile);
      },
      (message) => {
        if (!cancelled) setError(message);
      },
    ).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Google sign-in failed");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!googleConfigured()) {
    return (
      <p className="hint">
        Copy <code>.env.example</code> to <code>.env</code>, paste your Google Web client ID as{" "}
        <code>VITE_GOOGLE_CLIENT_ID</code>, and restart <code>npm run dev</code>. Add{" "}
        <code>http://localhost:5173</code> under Authorized JavaScript origins in{" "}
        <a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">
          Google Cloud
        </a>
        .
      </p>
    );
  }

  return (
    <>
      <div ref={host} className="google-btn-host" />
      {error && <p className="hint danger-text">{error}</p>}
    </>
  );
}
