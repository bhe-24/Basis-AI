import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { doc, runTransaction, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { callGeminiVercel } from "./api.js";
import { showModal, closeModal, updateQuotaUI } from "./ui.js";

// Login anonim untuk akses database
signInAnonymously(auth).catch((error) => console.error("Firebase Auth Error:", error));

// --- VARIABLES ---
const MAX_DAILY_QUOTA = 20;
let currentChallenge = null;
let lastFeedbackMarkdown = "";
let currentGlobalUsage = 0;
let isSystemOffline = false;

// --- OFFLINE DATA ---
const offlineData = {
    genres: ["Cyberpunk Nusantara", "Misteri Sejarah Majapahit", "Realisme Magis Pedesaan", "Thriller Psikologis Kos-kosan", "Horor Folklor Modern"],
    ideas: ["Mencium kebohongan dari bau keringat.", "Warung kopi di celah waktu.", "Buku harian dari masa depan.", "Aplikasi kencan berdasarkan cara mati.", "Hantu yang takut manusia."],
    premises: ["Dia harus menyelamatkan musuhnya untuk mencegah kiamat.", "Kucingnya ternyata agen rahasia kuno.", "Setiap berbohong, tubuhnya jadi transparan.", "Terjebak di hari yang sama tapi umur berkurang.", "Jalan pulang berubah jadi labirin tak berujung."]
};

// --- FIREBASE LOGIC (QUOTA) ---
function initQuotaListener() {
    const docRef = doc(db, "daily_limits", "global");
    onSnapshot(docRef, (docSnapshot) => {
        const today = new Date().toDateString();
        document.getElementById('quotaLoader').classList.add('hidden');
        document.getElementById('quotaText').classList.remove('hidden');

        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.date !== today) {
                currentGlobalUsage = 0;
                isSystemOffline = false;
            } else {
                currentGlobalUsage = data.count || 0;
            }
        } else {
            currentGlobalUsage = 0;
        }
        updateQuotaUI(currentGlobalUsage, MAX_DAILY_QUOTA, isSystemOffline);
    }, (error) => {
        console.error("Firebase Error:", error);
        isSystemOffline = true;
        updateQuotaUI(currentGlobalUsage, MAX_DAILY_QUOTA, isSystemOffline);
    });
}

async function consumeQuota() {
    if (isSystemOffline) return true; // Bypass jika offline (nanti pakai data offline)

    const docRef = doc(db, "daily_limits", "global");
    const today = new Date().toDateString();

    try {
        const result = await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
                transaction.set(docRef, { date: today, count: 1 });
                return "success";
            }
            const data = sfDoc.data();
            if (data.date !== today) {
                transaction.update(docRef, { date: today, count: 1 });
                return "success";
            }
            if (data.count >= MAX_DAILY_QUOTA) return "limit_reached";
            transaction.update(docRef, { count: data.count + 1 });
            return "success";
        });

        if (result === "limit_reached") throw new Error("QUOTA_EXCEEDED");
        return true;
    } catch (e) {
        console.error("Quota Error:", e);
        throw e;
    }
}

// --- MAIN FUNCTIONS ---

// 1. Generate Challenge
document.getElementById('generateBtn').addEventListener('click', async () => {
    const btn = document.getElementById('generateBtn');
    const btnText = document.getElementById('genBtnText');
    const loader = document.getElementById('genBtnLoader');
    const icon = document.getElementById('genBtnIcon');

    btn.disabled = true;
    loader.classList.remove('hidden');
    icon.classList.add('hidden');

    try {
        // Cek kuota dulu
        if (!isSystemOffline) await consumeQuota();

        btnText.innerText = "Meracik Ide...";

        const prompt = `
            Buatkan tantangan cerpen Bahasa Indonesia format JSON murni:
            { "genre": "...", "ide_unik": "...", "premis": "..." }
            Genre harus kreatif/unik. Jangan pakai markdown.
        `;

        // Panggil Vercel API
        let resultText = await callGeminiVercel(prompt);

        // Bersihkan Markdown jika AI bandel
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        currentChallenge = JSON.parse(resultText);
        currentChallenge.is_offline = false;

    } catch (error) {
        console.warn("Switching to Offline Mode:", error);

        let msg = "Dialihkan ke Mode Offline.";
        if (error.message === "QUOTA_EXCEEDED") msg = "Kuota harian habis. Mode Offline aktif.";
        else isSystemOffline = true;

        showModal("Info Sistem", msg);
        updateQuotaUI(currentGlobalUsage, MAX_DAILY_QUOTA, isSystemOffline);

        // Fallback ke data offline
        currentChallenge = {
            genre: offlineData.genres[Math.floor(Math.random() * offlineData.genres.length)],
            ide_unik: offlineData.ideas[Math.floor(Math.random() * offlineData.ideas.length)],
            premis: offlineData.premises[Math.floor(Math.random() * offlineData.premises.length)],
            is_offline: true
        };
    }

    // Render UI
    document.getElementById('resGenre').innerText = currentChallenge.genre;
    document.getElementById('resIdea').innerText = currentChallenge.ide_unik;
    document.getElementById('resPremise').innerText = currentChallenge.premis;

    document.getElementById('challengeCard').classList.remove('hidden');
    document.getElementById('writingSection').classList.remove('hidden');

    setTimeout(() => document.getElementById('challengeCard').scrollIntoView({behavior: 'smooth', block: 'center'}), 100);

    btn.disabled = false;
    btnText.innerText = "Buat Tantangan Baru";
    loader.classList.add('hidden');
    icon.classList.remove('hidden');
});

// 2. Submit Story
document.getElementById('submitBtn').addEventListener('click', async () => {
    if (!currentChallenge) return;

    if (currentGlobalUsage >= MAX_DAILY_QUOTA || isSystemOffline) {
        showModal("Fitur Terbatas", "Evaluasi AI tidak tersedia saat ini. Silakan unduh cerpen Anda.");
        return;
    }

    const storyText = document.getElementById('storyInput').value;
    const wordCount = document.getElementById('wordCount').innerText;
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('subBtnText');
    const loader = document.getElementById('subBtnLoader');

    btn.disabled = true;
    btnText.innerText = "Editor sedang membaca...";
    loader.classList.remove('hidden');

    try {
        await consumeQuota();

        const prompt = `
            Bertindak sebagai editor fiksi. Berikan feedback cerpen ini.
            Genre: ${currentChallenge.genre}
            Premis: ${currentChallenge.premis}
            Cerita: "${storyText.substring(0, 10000)}"
            Berikan output dalam format Markdown yang rapi.
        `;

        const feedback = await callGeminiVercel(prompt);
        lastFeedbackMarkdown = feedback;

        document.getElementById('aiFeedbackContent').innerHTML = marked.parse(feedback);
        document.getElementById('feedbackSection').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('feedbackSection').scrollIntoView({behavior: 'smooth'});
            showModal("Selesai!", "Jangan lupa unduh karyamu sebelum keluar.");
        }, 500);

    } catch (error) {
        showModal("Gagal", "Gagal melakukan evaluasi AI. Coba lagi atau unduh saja.");
        console.error(error);
    } finally {
        btn.disabled = false;
        btnText.innerText = "Kirim untuk Evaluasi AI";
        loader.classList.add('hidden');
    }
});

// 3. Download Document
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!currentChallenge) return;
    const storyText = document.getElementById('storyInput').value.replace(/\n/g, "<br>");
    const feedbackHtml = lastFeedbackMarkdown ? marked.parse(lastFeedbackMarkdown) : "<p><em>Tidak ada evaluasi.</em></p>";

    const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="utf-8"><title>${currentChallenge.genre}</title></head>
        <body style="font-family: 'Times New Roman', serif;">
            <h1>${currentChallenge.genre}</h1>
            <p><strong>Ide:</strong> ${currentChallenge.ide_unik}</p>
            <p><strong>Premis:</strong> ${currentChallenge.premis}</p>
            <hr>${storyText}<hr>
            <h3>Evaluasi AI</h3>${feedbackHtml}
        </body></html>`;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cendekia_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 4. Utils & Init
lucide.createIcons();

// Expose modal functions globally for the HTML onclick handlers (if any) or use event listeners.
// The original HTML uses `onclick="closeModal()"`. Since we are now modules, global scope is not default.
// We need to attach to window.
window.showModal = showModal;
window.closeModal = closeModal;

// Word Count Logic
const storyInput = document.getElementById('storyInput');
const wordCountDisplay = document.getElementById('wordCount');
const submitBtn = document.getElementById('submitBtn');
const warningText = document.getElementById('warningText');
const badge = document.getElementById('wordCountBadge');

storyInput.addEventListener('input', () => {
    const text = storyInput.value.trim();
    const count = text === "" ? 0 : text.split(/\s+/).length;
    wordCountDisplay.innerText = count;

    const isValid = count >= 700 && count <= 5000;
    const isOnline = (currentGlobalUsage < MAX_DAILY_QUOTA) && !isSystemOffline;

    if (isValid) {
        badge.className = "bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-mono";
        warningText.innerText = "";

        if (isOnline) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            submitBtn.classList.add('bg-navy', 'text-white', 'hover:bg-opacity-90');
        } else {
            submitBtn.disabled = true;
            warningText.innerText = "Mode Offline: Evaluasi AI tidak tersedia.";
            warningText.className = "px-4 pb-2 text-xs text-right text-mustard-dark h-6";
        }
    } else {
        submitBtn.disabled = true;
        submitBtn.className = "bg-gray-300 text-gray-500 cursor-not-allowed px-6 py-2 rounded-lg font-bold flex items-center gap-2";
        badge.className = "bg-red-500 text-white px-3 py-1 rounded-full text-sm font-mono";
        warningText.className = "px-4 pb-2 text-xs text-right text-red-500 h-6";

        if (count < 700) warningText.innerText = `Kurang ${700 - count} kata lagi.`;
        else warningText.innerText = `Kelebihan ${count - 5000} kata.`;
    }
});

initQuotaListener();
