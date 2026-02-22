import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Pastikan metode request adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Mengambil API KEY dari "Brankas" Vercel
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum disetting di Vercel!' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma2-9b-it" });

    // Kita tangkap 'action' dan 'payload' dari frontend
    const { action, payload } = req.body;
    let finalPrompt = "";

    // LOGIKA PROMPT UNTUK GENERATOR IDE
    if (action === 'generate_challenge') {
        finalPrompt = `
        Kamu adalah editor novel profesional. Buatkan satu tantangan menulis cerita berdasarkan aturan berikut:
        
        1. Pilih SATU genre secara acak dari daftar 20 genre ini: Romansa, Komedi Romantis, Humor, Slice of Life, Fantasi, Fiksi Ilmiah (Sci-Fi), Thriller Psikologis, Horor, Misteri, Drama, Fantasi Urban, Realisme Magis, Fiksi Sejarah, Petualangan, Aksi, Distopia, Paranormal Romance, Teen Fiction (Fiksi Remaja), Kriminal, Misteri Supernatural.
        2. Buat "ide_unik": Maksimal 2 paragraf. Harus berisi ide yang sangat unik dan mencantumkan informasi spesifik (benda/kejadian/karakter/aturan dunia) yang WAJIB dimasukkan penulis ke dalam ceritanya nanti.
        3. Buat "premis": Minimal 4 paragraf. Ceritakan premis awal, pengenalan karakter, konflik utama yang akan dihadapi, dan WAJIB menyertakan setidaknya satu baris kutipan dialog di dalam penjelasan premis ini. Gunakan simbol \\n\\n untuk pemisah paragraf.
        
        Keluarkan HANYA dalam format JSON murni tanpa awalan/akhiran markdown (jangan pakai \`\`\`json).
        Format wajib:
        {
          "genre": "Nama Genre Terpilih",
          "ide_unik": "Teks ide unik...",
          "premis": "Teks premis dengan \\n\\n sebagai ganti enter..."
        }
        `;
    } 
    // LOGIKA PROMPT UNTUK EVALUASI EDITOR
    else if (action === 'evaluate_story') {
        finalPrompt = `
        Bertindak sebagai editor fiksi profesional. Berikan feedback untuk cerpen ini.
        Genre Tantangan: ${payload.genre}
        Premis Awal: ${payload.premis}
        Cerita Penulis: "${payload.story}"
        
        Evaluasi apakah penulis memasukkan ide unik dengan baik, gaya bahasanya, dan emosinya. Berikan output dalam format Markdown yang rapi.
        `;
    } else {
        return res.status(400).json({ error: 'Aksi tidak dikenali oleh server.' });
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // Kirim jawaban kembali ke frontend
    return res.status(200).json({ answer: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
