import numpy as np


def get_article_strings(centroid, embeddings, abstracts, number_of_abstracts):
    """
    Get the strings that are most similar to the centroid.

    Parameters:
    - centroid: np.array, the centroid of the cluster.
    - embeddings: np.array, the embeddings of the cluster.
    - abstracts: np.array, the abstracts of the cluster.

    Returns:
    - abstracts: str, the abstract strings.
    """

    similarity = centroid.dot(embeddings.T)
    top_indices = np.argsort(similarity)[::-1][:number_of_abstracts]

    return '\n\n'.join(abstracts[top_indices])
