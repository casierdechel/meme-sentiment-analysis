import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  timeout: 30000,
});

/**
 * Predict hate speech from meme text
 * @param {string} ocrText - Teks yang diekstrak dari meme (WAJIB)
 * @param {string} topic - Topik meme (gender, individual, political, etc)
 * @param {string} caption - Deskripsi visual tambahan (OPSIONAL)
 * @returns {Promise<{label: string, is_hate: boolean, confidence: number, probabilities: object}>}
 */
export const predictHateSpeech = async (ocrText, topic, caption) => {
  try {
    const formData = new URLSearchParams();
    formData.append('ocr_text', ocrText);
    formData.append('topic', topic || 'social sub-groups');
    formData.append('caption', caption || '');

    const response = await api.post('/predict', formData);
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

/**
 * Send feedback for model improvement
 * @param {object} feedback - Data feedback dari user
 */
export const sendFeedback = async (feedback) => {
  try {
    // Simpan feedback ke file atau database
    // Untuk sekarang, kita simpan ke console dan localStorage
    
    // Simpan ke localStorage untuk tracking
    const savedFeedback = JSON.parse(localStorage.getItem('meme_feedback') || '[]');
    savedFeedback.push(feedback);
    localStorage.setItem('meme_feedback', JSON.stringify(savedFeedback));
    
    console.log('Feedback saved:', feedback);
    
    // Optional: Kirim ke backend jika ada endpoint
    // await api.post('/feedback', feedback);
    
    return { success: true };
  } catch (error) {
    console.error('Feedback error:', error);
    throw error;
  }
};

/**
 * Check API health and model status
 * @returns {Promise<{status: string, model_loaded: boolean, device: string}>}
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'unhealthy', model_loaded: false, device: 'unknown' };
  }
};

export default api;