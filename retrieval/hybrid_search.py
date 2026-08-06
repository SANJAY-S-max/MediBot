from langchain_community.retrievers import BM25Retriever
from sentence_transformers import CrossEncoder
from vector_db.chroma_store import vector_db_manager

# Re-ranker model
# We use a small, fast cross-encoder fine-tuned on MS MARCO for passage ranking
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)

class HybridRetriever:
    def __init__(self):
        self.vector_store = vector_db_manager.vector_store
        
        # 1. Initialize Semantic Retriever (using ChromaDB)
        self.semantic_retriever = self.vector_store.as_retriever(
            search_type="mmr", 
            search_kwargs={"k": 5, "fetch_k": 20}
        )
        
        # 2. Initialize BM25 Retriever
        # We need to fetch all documents from ChromaDB to build the BM25 index
        print("Initializing BM25 index from Vector DB...")
        all_docs = self.vector_store.get()
        documents = all_docs.get("documents", [])
        metadatas = all_docs.get("metadatas", [])
        
        if not documents:
            print("Warning: No documents found in Vector DB. BM25 will be empty.")
            self.bm25_retriever = BM25Retriever.from_texts(["dummy initialization"])
        else:
            from langchain_core.documents import Document
            doc_objects = [
                Document(page_content=doc, metadata=meta or {}) 
                for doc, meta in zip(documents, metadatas)
            ]
            self.bm25_retriever = BM25Retriever.from_documents(doc_objects)
            self.bm25_retriever.k = 5

    def retrieve_and_rerank(self, query: str, top_k: int = 3):
        """
        Executes Hybrid Search (Semantic + BM25) and re-ranks the results using a CrossEncoder.
        """
        print(f"Executing hybrid search for: '{query}'")
        
        # 1. Broad Retrieval
        semantic_docs = self.semantic_retriever.invoke(query)
        bm25_docs = self.bm25_retriever.invoke(query)
        
        # Combine and deduplicate
        unique_docs = {}
        for doc in semantic_docs + bm25_docs:
            if doc.page_content not in unique_docs:
                unique_docs[doc.page_content] = doc
                
        retrieved_docs = list(unique_docs.values())
        if not retrieved_docs:
            return []
            
        # 2. Cross-Encoder Re-ranking
        pairs = [[query, doc.page_content] for doc in retrieved_docs]
        scores = cross_encoder.predict(pairs)
        
        scored_docs = list(zip(retrieved_docs, scores))
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        top_docs = [doc for doc, score in scored_docs[:top_k]]
        
        for doc, score in scored_docs[:top_k]:
            doc.metadata['relevance_score'] = float(score)
            
        return top_docs

# Global instance
hybrid_retriever = None

def get_hybrid_retriever():
    global hybrid_retriever
    if hybrid_retriever is None:
        hybrid_retriever = HybridRetriever()
    return hybrid_retriever

if __name__ == "__main__":
    retriever = get_hybrid_retriever()
    results = retriever.retrieve_and_rerank("What happens when blood sugar goes up?")
    for i, res in enumerate(results):
        print(f"\n--- Result {i+1} (Score: {res.metadata.get('relevance_score', 0):.2f}) ---")
        print(res.page_content)
