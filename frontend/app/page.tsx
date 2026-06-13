import MemeAnalyzer from './components/MemeAnalyzer';
import ResultPanel from './components/ResultPanel';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <section className="mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface">
            Deteksi Ujaran Kebencian Meme
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl">
            IndoBERTweet — klasifikasi Hate / Not Hate dari teks meme Indonesia.
          </p>
        </section>

        {/* 2 Kolom: Form Kiri + Result Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri: Form Input */}
          <div>
            <MemeAnalyzer />
          </div>
          
          {/* Kolom Kanan: Hasil Analisis */}
          <div>
            <ResultPanel />
          </div>
        </div>
      </div>
    </main>
  );
}