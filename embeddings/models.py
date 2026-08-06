from langchain_community.embeddings import HuggingFaceEmbeddings

class EmbeddingModelConfig:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        
    def get_embeddings(self):
        """Returns the configured embedding model for LangChain."""
        return HuggingFaceEmbeddings(
            model_name=self.model_name,
            model_kwargs={'device': 'cpu'},  # Change to 'cuda' if GPU is available
            encode_kwargs={'normalize_embeddings': True}
        )

# Default instance
default_embeddings_config = EmbeddingModelConfig()
def get_default_embeddings():
    return default_embeddings_config.get_embeddings()
