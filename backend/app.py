import os
import json
import warnings
import threading
import queue
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from collections import deque
import time

# Suppress warnings
warnings.filterwarnings("ignore")

# ============================================
# APP INITIALIZATION
# ============================================
app = FastAPI(
    title="Meme Hate Speech Detection API",
    description="API dengan Online Learning - Model belajar langsung dari feedback user",
    version="3.0.0"
)

# CORS untuk Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CONSTANTS
# ============================================
MODEL_PATH = "./indobert-indomeme"
BASE_MODEL_NAME = "indolem/indobertweet-base-uncased"
MAX_LENGTH = 256
LABEL_NAMES = ["Not Hate", "Hate"]
VALID_TOPICS = [
    "gender", "individual", "national origin", "political",
    "religion", "institution/company", "social sub-groups", "none/others"
]

# Konfigurasi Online Learning
BUFFER_SIZE = 32
MIN_FEEDBACK_BEFORE_RETRAIN = 5
RETRAIN_BATCH_SIZE = 4
LEARNING_RATE = 5e-6

# ============================================
# ONLINE LEARNING BUFFER (FIXED)
# ============================================
class OnlineLearningBuffer:
    def __init__(self, max_size=BUFFER_SIZE):
        self.buffer = deque(maxlen=max_size)
        self.is_training = False
        self._max_size = max_size
        
    def add_feedback(self, feedback_data):
        self.buffer.append(feedback_data)
        print(f"📦 Buffer: {len(self.buffer)}/{self._max_size} feedbacks")
        
        if len(self.buffer) >= MIN_FEEDBACK_BEFORE_RETRAIN and not self.is_training:
            self.trigger_retraining()
    
    def trigger_retraining(self):
        if self.is_training:
            return
        
        def train():
            self.is_training = True
            try:
                print("🚀 Starting online retraining...")
                success = online_retrain(list(self.buffer))
                if success:
                    print("✅ Online retraining completed!")
                    self.buffer.clear()
                else:
                    print("⚠️ Online retraining failed, keeping buffer")
            except Exception as e:
                print(f"❌ Retraining error: {e}")
            finally:
                self.is_training = False
        
        thread = threading.Thread(target=train)
        thread.daemon = True
        thread.start()
    
    def get_buffer_size(self):
        return len(self.buffer)
    
    def get_max_size(self):
        return self._max_size

feedback_buffer = OnlineLearningBuffer()

# ============================================
# MODEL LOADING
# ============================================
if torch.backends.mps.is_available():
    device = torch.device("mps")
    print("✅ Using MPS (Apple Silicon) device")
elif torch.cuda.is_available():
    device = torch.device("cuda")
    print("✅ Using CUDA device")
else:
    device = torch.device("cpu")
    print("✅ Using CPU device")

tokenizer = None
model = None
current_model_version = 1
training_counter = 0

def load_model():
    global tokenizer, model
    try:
        if os.path.exists(MODEL_PATH):
            print(f"📂 Loading fine-tuned model from {MODEL_PATH}")
            tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
            print("✅ Fine-tuned model loaded!")
        else:
            print(f"📂 Loading base model: {BASE_MODEL_NAME}")
            tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
            model = AutoModelForSequenceClassification.from_pretrained(
                BASE_MODEL_NAME,
                num_labels=len(LABEL_NAMES)
            )
            print("✅ Base model loaded!")
        model.to(device)
        model.eval()
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def online_retrain(feedbacks):
    """Online retraining tanpa datasets library"""
    global model, training_counter
    
    if len(feedbacks) < MIN_FEEDBACK_BEFORE_RETRAIN:
        return False
    
    print(f"📚 Retraining with {len(feedbacks)} feedback samples...")
    
    # Siapkan data training
    input_ids_list = []
    attention_mask_list = []
    labels_list = []
    
    for fb in feedbacks:
        # Format text
        text = f"TOPIC: {fb['topic']} [SEP] OCR: {fb['ocr_text']} [SEP] CAPTION: {fb.get('caption', '')}"
        
        # Tokenize
        encoded = tokenizer(
            text,
            padding='max_length',
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors='pt'
        )
        
        # Tentukan label yang benar
        if fb['is_correct']:
            label = 1 if fb['predicted_label'] == 'Hate' else 0
        else:
            label = 0 if fb['predicted_label'] == 'Hate' else 1
        
        input_ids_list.append(encoded['input_ids'])
        attention_mask_list.append(encoded['attention_mask'])
        labels_list.append(torch.tensor([label]))
    
    # Stack semua tensor
    input_ids = torch.cat(input_ids_list, dim=0)
    attention_mask = torch.cat(attention_mask_list, dim=0)
    labels = torch.cat(labels_list, dim=0)
    
    # Buat DataLoader
    dataset = TensorDataset(input_ids, attention_mask, labels)
    dataloader = DataLoader(dataset, batch_size=min(RETRAIN_BATCH_SIZE, len(dataset)), shuffle=True)
    
    # Setup optimizer
    model.train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    
    # Training loop
    num_epochs = 3
    for epoch in range(num_epochs):
        epoch_loss = 0
        for batch in dataloader:
            batch_input_ids = batch[0].to(device)
            batch_attention_mask = batch[1].to(device)
            batch_labels = batch[2].to(device)
            
            outputs = model(
                batch_input_ids, 
                attention_mask=batch_attention_mask, 
                labels=batch_labels
            )
            loss = outputs.loss
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        avg_loss = epoch_loss / len(dataloader)
        print(f"📚 Epoch {epoch+1}/{num_epochs} - Loss: {avg_loss:.4f}")
    
    model.eval()
    training_counter += 1
    
    # Save model periodically
    if training_counter % 5 == 0:
        save_path = f"./model_version_{training_counter}"
        model.save_pretrained(save_path)
        tokenizer.save_pretrained(save_path)
        print(f"💾 Model saved to {save_path}")
    
    return True

@app.on_event("startup")
async def startup_event():
    load_model()

# ============================================
# HELPER FUNCTIONS
# ============================================
def predict_hate(ocr_text: str, topic: str = "", caption: str = ""):
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model_input = f"TOPIC: {topic} [SEP] OCR: {ocr_text} [SEP] CAPTION: {caption}"
    
    inputs = tokenizer(
        model_input,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
    )
    
    inputs = {key: value.to(device) for key, value in inputs.items()}
    
    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        pred = torch.argmax(probs, dim=1).item()
    
    return {
        "label": LABEL_NAMES[pred],
        "is_hate": pred == 1,
        "confidence": float(probs[0][pred]),
        "probabilities": {
            "not_hate": float(probs[0][0]),
            "hate": float(probs[0][1])
        }
    }

# ============================================
# PYDANTIC MODELS
# ============================================
class FeedbackModel(BaseModel):
    ocr_text: str
    topic: str
    caption: Optional[str] = ""
    predicted_label: str
    is_correct: bool
    confidence: float
    timestamp: str

# ============================================
# API ENDPOINTS
# ============================================
@app.get("/")
async def root():
    return {
        "name": "Meme Hate Speech Detection API - Online Learning",
        "status": "running",
        "model_loaded": model is not None,
        "device": str(device),
        "online_learning": {
            "enabled": True,
            "buffer_size": feedback_buffer.get_buffer_size(),
            "min_feedback_before_retrain": MIN_FEEDBACK_BEFORE_RETRAIN,
            "is_training": feedback_buffer.is_training
        },
        "total_retraining": training_counter
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "device": str(device),
        "is_training": feedback_buffer.is_training,
        "buffer_size": feedback_buffer.get_buffer_size()
    }

@app.post("/predict")
async def predict(
    ocr_text: str = Form(...),
    topic: str = Form("none/others"),
    caption: str = Form("")
):
    if not ocr_text.strip():
        raise HTTPException(status_code=400, detail="OCR text cannot be empty")
    
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if topic not in VALID_TOPICS:
        topic = "none/others"
    
    try:
        result = predict_hate(ocr_text, topic, caption)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def save_feedback(feedback: FeedbackModel, background_tasks: BackgroundTasks):
    """Simpan feedback - Model akan BELAJAR langsung!"""
    try:
        feedback_dict = feedback.dict()
        feedback_dict["saved_at"] = datetime.now().isoformat()
        
        print(f"\n📝 Feedback received:")
        print(f"   Text: {feedback.ocr_text[:50]}...")
        print(f"   Prediction: {feedback.predicted_label}")
        print(f"   Correct: {feedback.is_correct}")
        print(f"   Confidence: {feedback.confidence:.2f}")
        
        background_tasks.add_task(feedback_buffer.add_feedback, feedback_dict)
        
        return {
            "status": "success",
            "message": "Terima kasih! Model akan belajar dari feedback ini.",
            "buffer_size": feedback_buffer.get_buffer_size()
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/online-learning/stats")
async def get_online_learning_stats():
    return {
        "buffer_size": feedback_buffer.get_buffer_size(),
        "max_buffer": feedback_buffer.get_max_size(),
        "min_feedback_before_retrain": MIN_FEEDBACK_BEFORE_RETRAIN,
        "is_training": feedback_buffer.is_training,
        "total_retraining": training_counter,
        "retrain_batch_size": RETRAIN_BATCH_SIZE,
        "learning_rate": LEARNING_RATE
    }

@app.post("/online-learning/force-retrain")
async def force_retrain():
    if feedback_buffer.get_buffer_size() == 0:
        return {"status": "error", "message": "No feedback in buffer"}
    
    if feedback_buffer.is_training:
        return {"status": "error", "message": "Already training"}
    
    feedback_buffer.trigger_retraining()
    return {"status": "success", "message": "Retraining triggered"}

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*55)
    print("🚀 Meme Hate Speech Detection API - ONLINE LEARNING")
    print("="*55)
    print(f"📍 Server: http://0.0.0.0:8000")
    print(f"📖 Docs: http://0.0.0.0:8000/docs")
    print(f"📦 Buffer: {MIN_FEEDBACK_BEFORE_RETRAIN} feedbacks to retrain")
    print("="*55 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)