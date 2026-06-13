import re
from typing import List, Optional
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse, urljoin

from bs4 import BeautifulSoup
import requests

session = requests.Session()

session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0 Safari/537.36"
    )
})

def discover_article_urls_listing(
    listing_url: str,
    allow_domains: Optional[List[str]],
    user_agent: str,
    timeout_sec: int,
    link_selector: str = "a[href]",
    allow_url_patterns: Optional[List[str]] = None,
    deny_url_patterns: Optional[List[str]] = None,
) -> List[str]:
    headers = {
    "User-Agent": user_agent,
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Referer": "https://www.google.com/"
    }
    r = session.get(
    listing_url,
    headers=headers,
    timeout=(10, timeout_sec)
    )

    if r.status_code == 404:
        return []

    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    urls = []
    for a in soup.select(link_selector):
        href = (a.get("href") or "").strip()
        if not href:
            continue

        full = urljoin(listing_url, href)
        #print(full)

        if allow_domains:
            netloc = urlparse(full).netloc
            if not any(netloc.endswith(d) for d in allow_domains):
                continue

        if "#" in full:
            continue

        if deny_url_patterns:
            if any(re.search(p, full) for p in deny_url_patterns):
                continue

        if allow_url_patterns:
            if not any(re.search(p, full) for p in allow_url_patterns):
                continue

        urls.append(full)

    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            out.append(u)
            seen.add(u)
    return out

def build_listing_pages(source: dict) -> list[str]:
    base = source["url"]
    pag = source.get("pagination")
    if not pag:
        return [base]

    start = int(pag.get("start", 1))
    end = int(pag.get("end", start))
    mode = pag.get("mode")

    pages = []

    if mode == "path_format":
        for p in range(start, end + 1):
            pages.append(base.format(page=p))
        return pages

    if mode == "query":
        page_param = pag.get("page_param", "page")
        u = urlparse(base)
        qs = parse_qs(u.query)

        for p in range(start, end + 1):
            qs[page_param] = [str(p)]
            new_query = urlencode(qs, doseq=True)
            pages.append(urlunparse((u.scheme, u.netloc, u.path, u.params, new_query, u.fragment)))

        return pages

    return [base]
