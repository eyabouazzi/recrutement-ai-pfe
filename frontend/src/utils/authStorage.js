const AUTH_TOKEN_KEY = 'auth-token';

function getStorages() {
    if (typeof window === 'undefined') {
        return null;
    }

    return {
        local: window.localStorage,
        session: window.sessionStorage,
    };
}

export function getStoredToken() {
    const storages = getStorages();
    if (!storages) {
        return null;
    }

    return storages.local.getItem(AUTH_TOKEN_KEY) || storages.session.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token, remember = true) {
    const storages = getStorages();
    if (!storages || !token) {
        return;
    }

    clearStoredToken();
    const target = remember ? storages.local : storages.session;
    target.setItem(AUTH_TOKEN_KEY, token);
}

export function syncStoredToken(token) {
    if (!token) {
        clearStoredToken();
        return;
    }

    const storages = getStorages();
    if (!storages) {
        return;
    }

    const hasSessionToken = Boolean(storages.session.getItem(AUTH_TOKEN_KEY));
    const hasLocalToken = Boolean(storages.local.getItem(AUTH_TOKEN_KEY));

    setStoredToken(token, hasLocalToken || !hasSessionToken);
}

export function clearStoredToken() {
    const storages = getStorages();
    if (!storages) {
        return;
    }

    storages.local.removeItem(AUTH_TOKEN_KEY);
    storages.session.removeItem(AUTH_TOKEN_KEY);
}
