from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.prediction import router as prediction_router

app = FastAPI(title='Fake News Detection API', version='1.0.0')
frontend_dist = Path(__file__).resolve().parents[1] / 'frontend' / 'dist'

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(prediction_router, prefix='/api')

if frontend_dist.is_dir():
    app.mount('/assets', StaticFiles(directory=frontend_dist / 'assets'), name='assets')


@app.get('/')
def home():
    if frontend_dist.is_dir():
        return FileResponse(frontend_dist / 'index.html')
    return {'message': 'Fake News Detection API is running.'}


@app.get('/{path:path}', include_in_schema=False)
def frontend_routes(path: str):
    if frontend_dist.is_dir() and not path.startswith('api/'):
        return FileResponse(frontend_dist / 'index.html')
    raise HTTPException(status_code=404, detail='Not Found')
