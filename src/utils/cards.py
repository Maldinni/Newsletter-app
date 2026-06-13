from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

try:
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:  # Pillow antigo
    RESAMPLE = Image.LANCZOS


def _load_font(path, size):
    """Carrega uma fonte .ttf; cai em Arial e depois na fonte padrão."""
    for candidate in (path, "arial.ttf"):
        if not candidate:
            continue
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _fit_crop(img, w, h):
    """Recorta/redimensiona para preencher WxH sem distorcer."""
    return ImageOps.fit(img, (w, h), method=RESAMPLE, centering=(0.5, 0.4))


def _wrap(draw, text, font, max_width):
    """Quebra de linha por largura real do texto renderizado."""
    words = (text or "").split()
    lines, cur = [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def compose_card(image_path, headline, image_credit, ai_label, cfg,
                 logo_path=None):
    """
    Compõe um card de Instagram: foto escolhida + gradiente + manchete +
    crédito da imagem + rótulo de IA + logo. 100% determinístico.
    """
    W, H = cfg["width"], cfg["height"]
    margin = cfg["margin"]
    accent = tuple(cfg["accent_rgb"])

    base = Image.open(image_path).convert("RGB")
    base = _fit_crop(base, W, H).convert("RGBA")

    # Gradiente escuro de baixo para cima (legibilidade do texto)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    grad_start = int(H * cfg["gradient_start"])
    span = max(H - grad_start, 1)
    for y in range(grad_start, H):
        alpha = int(255 * cfg["gradient_max_alpha"] * (y - grad_start) / span)
        od.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    card = Image.alpha_composite(base, overlay)

    draw = ImageDraw.Draw(card)
    headline_font = _load_font(cfg.get("headline_font"), cfg["headline_size"])
    small_font = _load_font(cfg.get("small_font"), cfg["small_size"])

    max_text_w = W - 2 * margin
    lines = _wrap(draw, headline, headline_font, max_text_w)

    line_h = cfg["headline_size"] + cfg["line_spacing"]
    footer_h = cfg["small_size"] * 2 + 24
    y = H - margin - footer_h - len(lines) * line_h

    # Barra de destaque acima da manchete
    draw.rectangle([margin, y - 20, margin + 64, y - 12], fill=accent)

    for line in lines:
        draw.text((margin, y), line, font=headline_font, fill=(255, 255, 255))
        y += line_h

    # Rodapé: crédito da imagem + rótulo de IA
    fy = H - margin - footer_h + 8
    if image_credit:
        draw.text((margin, fy), image_credit, font=small_font, fill=(205, 205, 205))
        fy += cfg["small_size"] + 6
    if ai_label:
        draw.text((margin, fy), ai_label, font=small_font, fill=(205, 205, 205))

    # Logo opcional (canto superior esquerdo)
    if logo_path and Path(logo_path).exists():
        try:
            logo = Image.open(logo_path).convert("RGBA")
            lw = cfg.get("logo_width", 150)
            logo = logo.resize((lw, int(logo.height * lw / logo.width)), RESAMPLE)
            card.alpha_composite(logo, (margin, margin))
        except Exception:
            pass

    return card.convert("RGB")


def build_image_credit(candidate):
    """Monta a linha de crédito da imagem a partir do candidato escolhido."""
    if not candidate:
        return ""
    author = candidate.get("artist") or candidate.get("credit") or ""
    license_name = candidate.get("license") or ""
    parts = [p for p in (author.strip(), license_name.strip()) if p]
    return "Imagem: " + " · ".join(parts) if parts else ""
