/** Simple file d'attente séquentielle pour limiter les appels OpenAI concurrents. */
let chain = Promise.resolve();

function runSerial(fn) {
    const next = chain.then(() => fn(), () => fn());
    chain = next.catch(() => {});
    return next;
}

module.exports = { runSerial };
