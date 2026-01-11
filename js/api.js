export async function callGeminiVercel(promptText) {
    // Kita panggil backend Vercel kita sendiri, BUKAN Google langsung
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
    });

    if (!response.ok) throw new Error("SERVER_ERROR");

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return data.answer;
}
