/**
 * Public endpoints — no auth (uses fetch to avoid axios 401 redirect side effects).
 */
const base = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export async function submitLead(payload) {
  const res = await fetch(`${base()}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de l’envoi. Réessayez.');
  }
  return data;
}
