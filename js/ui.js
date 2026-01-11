// UI helper functions

export function showModal(title, msg) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerHTML = msg;
    document.getElementById('customModal').classList.add('active');
}

export function closeModal() {
    document.getElementById('customModal').classList.remove('active');
}

export function updateQuotaUI(currentGlobalUsage, MAX_DAILY_QUOTA, isSystemOffline) {
    let remaining = Math.max(0, MAX_DAILY_QUOTA - currentGlobalUsage);
    if (isSystemOffline) remaining = 0;

    const text = document.getElementById('quotaText');
    const indicator = document.getElementById('quotaIndicator');
    const modeInd = document.getElementById('modeIndicator');
    const evalInfo = document.getElementById('evaluationInfo');

    text.innerText = `${remaining}/${MAX_DAILY_QUOTA}`;

    if (remaining === 0) {
        indicator.className = "w-2 h-2 rounded-full bg-red-500";
        text.className = "text-sm font-bold text-red-600";
        modeInd.classList.remove('hidden');
        modeInd.innerHTML = `Mode: <span class="text-red-600 font-bold">${isSystemOffline ? 'Offline (Gangguan)' : 'Pustaka Offline'}</span>`;
        evalInfo.classList.remove('hidden');
        evalInfo.innerText = isSystemOffline ? "Evaluasi tidak tersedia (Gangguan)" : "Evaluasi tidak tersedia (Kuota Habis)";
    } else {
        indicator.className = "w-2 h-2 rounded-full bg-green-500";
        text.className = "text-sm font-bold text-navy";
        modeInd.classList.remove('hidden');
        modeInd.innerHTML = `Mode: <span class="text-green-600 font-bold">AI Online</span>`;
        evalInfo.classList.add('hidden');
    }
}
