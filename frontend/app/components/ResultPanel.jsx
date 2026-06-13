'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Loader2, BarChart3, CheckCircle, XCircle } from 'lucide-react';

let resultUpdateCallback = null;

export const updateResult = (result) => {
  if (resultUpdateCallback) {
    resultUpdateCallback(result);
  }
};

export const clearResult = () => {
  if (resultUpdateCallback) {
    resultUpdateCallback(null);
  }
};

export default function ResultPanel() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    resultUpdateCallback = (newResult) => {
      setResult(newResult);
      setIsLoading(false);
      setFeedbackGiven(false);
    };
    return () => {
      resultUpdateCallback = null;
    };
  }, []);

  const handleFlag = async (isCorrect) => {
    if (!result) return;
    
    try {
        const response = await fetch('http://localhost:8000/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ocr_text: result.ocr_text,
                topic: result.topic,
                caption: result.caption || "",
                predicted_label: result.label,
                is_correct: isCorrect,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            setFeedbackGiven(true);
        }
    } catch (err) {
        console.error('Feedback error:', err);
    }
};

  return (
    <div className="glass-panel rounded-xl overflow-hidden sticky top-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent px-6 py-4 border-b border-outline-variant/30">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Hasil Analisis
        </h3>
        <p className="text-primary text-outline-variant mt-1">
          Hasil deteksi ujaran kebencian akan muncul di sini
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-on-surface-variant">Sedang menganalisis...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <span className="text-4xl">🤔</span>
            </div>
            <p className="text-on-surface-variant font-medium">
              Belum ada hasil analisis
            </p>
            <p className="text-sm text-outline-variant mt-1">
              Masukkan teks meme dan klik Submit
            </p>
          </div>
        )}

        {/* Result Content */}
        {!isLoading && result && (
          <div className="space-y-5">
            {/* Status Card */}
            <div className={`p-4 rounded-xl border-2 text-center ${
              result.is_hate 
                ? 'bg-red-900/20 border-red-700' 
                : 'bg-green-900/20 border-green-700'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {result.is_hate ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
                <span className="text-lg font-bold">
                  {result.is_hate ? "Mengandung Ujaran Kebencian" : "Tidak Mengandung Ujaran Kebencian"}
                </span>
              </div>
              <p className="text-white text-outline-variant">
                Tingkat keyakinan: {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>

            {/* Confidence Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">Tingkat Keyakinan</span>
                <span className="font-medium text-on-surface">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    result.is_hate ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Probability Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-container-low rounded-xl text-center">
                <div className="text-sm font-medium text-on-surface-variant flex items-center gap-2">Not Hate</div>
                <div className="font-bold text-2xl text-green-400">
                  {(result.probabilities.not_hate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl text-center">
                <div className="text-sm font-medium text-on-surface-variant flex items-center gap-2">Hate</div>
                <div className="font-bold text-2xl text-red-400">
                  {(result.probabilities.hate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Input Review */}
            <div className="p-3 bg-surface-container-lowest rounded-xl">
              <p className="text-on-surface-variant text-xs mb-2">Teks yang dianalisis:</p>
              <p className="text-sm text-on-surface italic leading-relaxed">
                "{result.ocr_text}"
              </p>
              {result.caption && (
                <>
                  <p className="text-outline-variant text-xs mt-3 mb-2">Caption:</p>
                  <p className="text-sm text-on-surface italic leading-relaxed">
                    "{result.caption}"
                  </p>
                </>
              )}
            </div>

            {/* Feedback Section */}
            {!feedbackGiven && (
              <div className="pt-2 border-t border-outline-variant/30">
                <p className="text-sm text-on-surface-variant text-center mb-3">
                  Apakah hasil analisis ini benar?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFlag(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-900/20 hover:bg-green-900/40 border border-green-700 rounded-lg text-green-400 text-sm transition-all"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Ya, Benar
                  </button>
                  <button
                    onClick={() => handleFlag(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm transition-all"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Tidak, Salah
                  </button>
                </div>
              </div>
            )}

            {feedbackGiven && (
              <div className="text-center text-sm text-green-400 py-3">
                ✅ Terima kasih atas feedback-nya!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-surface-container-low/50 px-6 py-3 border-t border-outline-variant/30">
        <p className="text-xs text-outline-variant text-center">
          IndoBERTweet — Klasifikasi Hate / Not Hate dari teks meme Indonesia
        </p>
      </div>
    </div>
  );
}