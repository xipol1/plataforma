export function getToken() {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem("token") ?? "" : "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", token);
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: token }));
      } catch {}
    }
  } catch {}
}

export function clearToken() {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
      } catch {}
    }
  } catch {}
}

export function onTokenChange(cb: (token: string) => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === "token") {
      cb(e.newValue ?? "");
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handler);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handler);
    }
  };
}

