/**
 * Envoie un POST JSON vers webhookUrl (intégrations / ATS maison).
 * Ne bloque pas le flux principal en cas d'échec.
 */
async function dispatchSubmissionWebhook(webhookUrl, payload) {
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) return;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ac.signal,
        });
    } catch (e) {
        console.error('Webhook dispatch failed:', e.message || e);
    } finally {
        clearTimeout(t);
    }
}

module.exports = { dispatchSubmissionWebhook };
