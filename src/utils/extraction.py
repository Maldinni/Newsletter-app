import re
import json
import requests
import hashlib
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse

from typing import Any, Dict, Optional
from time import sleep
from newspaper import Article
from dateutil import parser as dateparser

def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def limit_words(text: Optional[str], max_words: int = 1000) -> Optional[str]:
    if not text:
        return None
    text = normalize_whitespace(text)

    words = text.split(" ")
    if len(words) <= max_words:
        return text

    return " ".join(words[:max_words])


def normalize_url(url: str) -> str:
    """
    Remove tracking params e fragmentos para criar um canonical URL.
    """
    parts = urlparse(url)
    return urlunparse((parts.scheme, parts.netloc, parts.path, "", "", ""))


def extract_text_from_html(url: str, user_agent: str, timeout: int = 20) -> str:
    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
        "Cache-Control": "no-cache",
    }

    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    paragraphs = []
    for p in soup.find_all("p"):
        txt = p.get_text(" ", strip=True)
        if len(txt) > 30:
            paragraphs.append(txt)

    text = " ".join(paragraphs)
    return normalize_whitespace(text)

# Atributos de <meta> que costumam carregar a data de publicação,
# em ordem de confiabilidade.
_DATE_META_KEYS = [
    ("property", "article:published_time"),
    ("property", "og:article:published_time"),
    ("name", "article:published_time"),
    ("itemprop", "datePublished"),
    ("name", "datePublished"),
    ("name", "parsely-pub-date"),
    ("name", "sailthru.date"),
    ("name", "pubdate"),
    ("name", "publishdate"),
    ("name", "publish-date"),
    ("name", "dc.date"),
    ("name", "dc.date.issued"),
    ("name", "date"),
    ("property", "og:updated_time"),
    ("name", "lastmod"),
]


def _parse_date(value: Optional[str]) -> Optional[str]:
    """Faz parsing tolerante de uma string de data e devolve ISO 8601."""
    if not value:
        return None
    try:
        dt = dateparser.parse(value)
    except (ValueError, OverflowError, TypeError):
        return None
    return dt.isoformat() if dt else None


def _iter_jsonld_nodes(data):
    """Achata listas e blocos @graph de um JSON-LD."""
    if isinstance(data, list):
        for item in data:
            yield from _iter_jsonld_nodes(item)
    elif isinstance(data, dict):
        yield data
        if "@graph" in data:
            yield from _iter_jsonld_nodes(data["@graph"])


def _date_from_jsonld(soup: BeautifulSoup) -> Optional[str]:
    for tag in soup.find_all("script", type="application/ld+json"):
        raw = tag.string or tag.get_text() or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            continue
        for node in _iter_jsonld_nodes(data):
            if not isinstance(node, dict):
                continue
            for key in ("datePublished", "dateCreated", "datePosted", "uploadDate"):
                parsed = _parse_date(node.get(key))
                if parsed:
                    return parsed
    return None


def extract_publish_date(soup: BeautifulSoup) -> Optional[str]:
    """
    Tenta recuperar a data de publicação do HTML quando o newspaper falha.
    Ordem: JSON-LD (mais confiável em portais) -> meta tags -> <time>.
    """
    parsed = _date_from_jsonld(soup)
    if parsed:
        return parsed

    for attr, val in _DATE_META_KEYS:
        tag = soup.find("meta", attrs={attr: val})
        if tag and tag.get("content"):
            parsed = _parse_date(tag["content"])
            if parsed:
                return parsed

    time_tag = soup.find("time", attrs={"datetime": True})
    if time_tag:
        parsed = _parse_date(time_tag.get("datetime"))
        if parsed:
            return parsed

    return None


def extract_article(
    url: str,
    source_name: str,
    user_agent: str,
    language: str = "pt"
) -> Dict[str, Any]:

    a = Article(url, language=language)
    a.download()
    a.parse()

    raw_text = a.text or ""
    raw_text = normalize_whitespace(raw_text)

    word_count = len(raw_text.split()) if raw_text else 0

    # Fallback se o newspaper falhar
    if word_count < 120:
        try:
            html_text = extract_text_from_html(url, user_agent)
            if len(html_text.split()) > word_count:
                raw_text = html_text
                word_count = len(raw_text.split())
        except Exception:
            pass

    canonical = normalize_url(url)
    text = limit_words(raw_text, 1000)

    # Data: newspaper primeiro; se falhar, fallback no HTML já baixado.
    publish_date = a.publish_date.isoformat() if a.publish_date else None
    if publish_date is None and getattr(a, "html", None):
        try:
            soup = BeautifulSoup(a.html, "html.parser")
            publish_date = extract_publish_date(soup)
        except Exception:
            pass

    return {
        "source": source_name,
        "domain": urlparse(url).netloc,
        "canonical_url": canonical,
        "url": url,
        "title": a.title or None,
        "authors": a.authors or [],
        "publish_date": publish_date,
        "text": text,
        "word_count": word_count,
        "text_hash": hashlib.sha1(raw_text.encode("utf-8")).hexdigest() if raw_text else None,
    }

def extract_with_retry(
    url: str,
    source_name: str,
    user_agent: str,
    num_attempts: int,
    sleep_time: float
) -> Optional[Dict[str, Any]]:

    for _ in range(num_attempts):
        try:
            return extract_article(url, source_name, user_agent)
        except Exception:
            sleep(sleep_time)

    return None
