from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'history.db'


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        '''
    )
    conn.commit()
    conn.close()


def save_prediction(text: str, prediction: str, confidence: float):
    conn = get_connection()
    conn.execute(
        'INSERT INTO predictions (text, prediction, confidence) VALUES (?, ?, ?)',
        (text, prediction, confidence),
    )
    conn.commit()
    conn.close()


def get_history(limit: int = 10):
    conn = get_connection()
    rows = conn.execute(
        'SELECT id, text, prediction, confidence, created_at FROM predictions ORDER BY id DESC LIMIT ?',
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
