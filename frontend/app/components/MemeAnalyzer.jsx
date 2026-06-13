'use client';

import { useState, useCallback, useEffect } from 'react';
import { Rocket, Trash2, AlertCircle, Loader2, Send, FileText, Tag, Image as ImageIcon } from 'lucide-react';
import { predictHateSpeech, checkHealth } from '../services/api';
import { updateResult, clearResult } from './ResultPanel';

// Daftar topik yang VALID
const VALID_TOPICS = [
  { value: "gender", label: "👫 Gender" },
  { value: "individual", label: "👤 Individual" },
  { value: "national origin", label: "🌏 National Origin" },
  { value: "political", label: "🏛️ Political" },
  { value: "religion", label: "⛪ Religion" },
  { value: "institution/company", label: "🏢 Institution/Company" },
  { value: "social sub-groups", label: "👥 Social Sub-groups" },
  { value: "none/others", label: "📝 None/Others" }
];

export default function MemeAnalyzer() {
  const [ocrText, setOcrText] = useState('');
  const [topic, setTopic] = useState('social sub-groups');
  const [caption, setCaption] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Check API health
  useEffect(() => {
    const checkApi = async () => {
      try {
        const health = await checkHealth();
        setIsApiReady(health.status === 'healthy');
      } catch (err) {
        console.error('API not reachable:', err);
        setIsApiReady(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = useCallback(() => {
    setOcrText('');
    setTopic('social sub-groups');
    setCaption('');
    setError(null);
    clearResult();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!ocrText.trim()) {
      setError('Mohon masukkan teks meme');
      return;
    }

    if (!isApiReady) {
      setError('API tidak tersedia. Pastikan backend sedang berjalan.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    updateResult(null);

    try {
      const prediction = await predictHateSpeech(ocrText, topic, caption);
      
      updateResult({
        label: prediction.label,
        is_hate: prediction.is_hate,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        ocr_text: ocrText,
        topic: topic,
        caption: caption
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || 'Gagal menganalisis. Pastikan backend server berjalan.');
      clearResult();
    } finally {
      setIsAnalyzing(false);
    }
  }, [ocrText, topic, caption, isApiReady]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header dengan gradien */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent px-6 py-4 border-b border-outline-variant/30">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Input Teks Meme
        </h3>
        <p className="text-primary text-outline-variant mt-1">
          Masukkan teks dari meme untuk dianalisis
        </p>
      </div>

      {/* Body Form */}
      <div className="p-6 space-y-5">
        {/* API Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isApiReady ? 'bg-green-900/20 text-green-400 border border-green-700/50' : 'bg-red-900/20 text-red-400 border border-red-700/50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isApiReady ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span>Status API: {isApiReady ? 'Tersambung' : 'Terputus'}</span>
          {!isApiReady && (
            <span className="text-xs ml-auto">Jalankan: cd backend &amp;&amp; python app.py</span>
          )}
        </div>

        {/* Teks meme (OCR) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
            <span className="text-red-400">*</span>
            Teks meme (OCR)
          </label>
          <div className="relative">
            <textarea
              className="w-full bg-[#121214] border border-outline-variant rounded-lg p-3 text-on-surface placeholder:text-outline/50 resize-none focus:outline-none focus:border-primary transition-colors"
              placeholder="Tulis teks yang ada di meme..."
              rows={3}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value.slice(0, 500))}
            />
            <div className="absolute bottom-3 right-3 text-xs text-outline bg-[#121214] px-1">
              {ocrText.length} / 500
            </div>
          </div>
        </div>

        {/* Topik Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Topik
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-[#121214] border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {VALID_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Caption (deskripsi visual)
            <span className="text-xs text-outline-variant">Opsional</span>
          </label>
          <div className="relative">
            <textarea
              className="w-full bg-[#121214] border border-outline-variant rounded-lg p-3 text-on-surface placeholder:text-outline/50 resize-none focus:outline-none focus:border-primary transition-colors"
              placeholder="Deskripsi gambar (opsional)..."
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            />
            <div className="absolute bottom-3 right-3 text-xs text-outline bg-[#121214] px-1">
              {caption.length} / 300
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClear}
            className="px-5 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-variant transition-all flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !isApiReady || !ocrText.trim()}
            className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}