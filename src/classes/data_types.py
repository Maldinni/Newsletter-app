from dataclasses import dataclass, field
from typing import List


@dataclass
class Embeddings:
    """Data class for an embedding.
    """
    urls: List[str] = field(default_factory=list)
    embeddings: List[List[float]] = field(default_factory=list)
    texts: List[str] = field(default_factory=list)