# Cendekia Aksara Idea Generator

Cendekia Aksara Idea Generator adalah aplikasi web berbasis AI yang membantu penulis menemukan ide cerita unik, genre kreatif, dan premis menarik. Aplikasi ini juga menyediakan fitur evaluasi cerpen menggunakan AI untuk memberikan umpan balik yang konstruktif.

## Fitur Utama

- **Idea Generator**: Menghasilkan genre, ide unik, dan premis cerita secara otomatis menggunakan AI.
- **Mode Offline**: Tetap dapat digunakan saat koneksi internet terganggu atau kuota AI habis dengan database lokal.
- **Writing Workspace**: Lembar kerja penulisan dengan penghitung kata dan validasi target (700 - 5.000 kata).
- **AI Editor**: Evaluasi cerpen otomatis yang memberikan ulasan mendalam.
- **Export Dokumen**: Unduh hasil karya dan evaluasi dalam format `.doc`.
- **Sistem Kuota**: Batasan penggunaan harian untuk menjaga stabilitas layanan.

## Teknologi

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (ES Modules).
- **Backend**: Vercel Serverless Functions.
- **AI**: Google Gemini (via Vercel Secure Gateway).
- **Database**: Firebase Firestore (untuk manajemen kuota).
- **Icons**: Lucide Icons.

## Struktur Proyek

```
/
├── api/                # Backend Serverless Functions
├── css/                # File Stylesheet
├── js/                 # Logika Aplikasi (Modular)
│   ├── app.js          # Main Entry Point
│   ├── api.js          # Interaksi API
│   ├── firebase-config.js # Konfigurasi Firebase
│   └── ui.js           # Manipulasi UI
├── index.html          # Halaman Utama
└── package.json        # Dependensi Node.js
```

## Cara Menjalankan

1.  Clone repositori ini.
2.  Install dependensi:
    ```bash
    npm install
    ```
3.  Jalankan menggunakan Vercel CLI (disarankan) atau serve statis untuk frontend saja.
    ```bash
    vercel dev
    ```

## Lisensi

[MIT License](LICENSE)
