import re
from typing import Optional

import pandas as pd



def normalize_labels(label_value: Optional[str]) -> str:
    if label_value is None:
        return 'unknown'
    value = str(label_value).strip().lower()
    if value in {'real', 'true', '1', 'reliable'}:
        return 'real'
    if value in {'fake', 'false', '0', 'misleading', 'unreliable'}:
        return 'fake'
    return value


def clean_text(text: Optional[str]) -> str:
    if pd.isna(text):
        return ''
    text = str(text)
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    text = re.sub(r'<.*?>', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        raise ValueError('Input dataframe is empty.')

    df = df.copy()
    if 'label' in df.columns:
        df['label'] = df['label'].apply(normalize_labels)
    if 'text' not in df.columns:
        if 'title' in df.columns and 'content' in df.columns:
            df['text'] = df['title'].fillna('') + ' ' + df['content'].fillna('')
        elif 'title' in df.columns:
            df['text'] = df['title']
        elif 'content' in df.columns:
            df['text'] = df['content']
        else:
            raise ValueError('No usable text column found. Expected text/title/content.')

    df['text'] = df['text'].apply(clean_text)
    df = df[df['text'].str.len() > 0].copy()
    df = df[df['label'].isin(['real', 'fake'])].copy()
    return df.reset_index(drop=True)
