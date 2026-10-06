# Fake News Detection Web Application

This project is a final-year fake news detection system built with a Python ML backend and a React frontend.

## Project overview

The application lets a user enter a news article or headline and receives a prediction indicating whether the content is likely real or fake. It includes:

- text preprocessing
- TF-IDF feature extraction
- logistic regression baseline model
- confidence score and probability output
- simple explainability text
- REST API backend
- React frontend interface
- basic prediction history storage

## Tech stack

- Python 3.11
- FastAPI
- scikit-learn
- pandas
- joblib
- React + Vite

## Directory structure

- backend/
- frontend/
- src/
- data/
- models/

## Setup

### 1. Create a virtual environment

```powershell
cd c:\Users\gvscr\OneDrive\Desktop\fake_news_detection\Fake-News-Detection
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Python dependencies

```powershell
pip install -r backend\requirements.txt
```

### 3. Train the model

```powershell
python -m src.models.train
```

### 4. Start the backend API

```powershell
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

## Important note

The raw dataset files in the project were empty placeholders. For a real working model, download and place the real dataset into:

- data/raw/True.csv
- data/raw/Fake.csv

Then rerun the training command.

## Deploy on Render

The repository includes a Render Blueprint and a Dockerfile that deploy the frontend and API together. Push the project to GitHub, then create a new Blueprint in the [Render Dashboard](https://dashboard.render.com/) and select this repository. Render will build and deploy the service and provide its public `onrender.com` URL.

The free web-service plan may sleep when idle, so its first request after a period of inactivity can take longer.

## Default API endpoint

- POST http://localhost:8000/api/predict
- GET http://localhost:8000/api/history
- GET http://localhost:8000/api/health

## Example request body

```json
{
  "text": "Government officials announced a major policy change today.",
  "url": ""
}
```

## Expected behavior

The API returns:

- prediction
- confidence score
- probabilities
- explanation
- model name
