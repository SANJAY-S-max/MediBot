import os
import logging
from typing import List

logger = logging.getLogger("uvicorn.error")

# Try to import FAISS and SentenceTransformers, handling missing dependencies gracefully
try:
    from langchain_community.vectorstores import FAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    LIBRARIES_AVAILABLE = True
except ImportError:
    LIBRARIES_AVAILABLE = False
    logger.warning("FAISS or SentenceTransformers libraries not fully loaded. RAG will fall back to simple keyword matching.")

class RAGService:
    def __init__(self):
        self.index_path = "faiss_index"
        self.docs_dir = "knowledge_base_docs"
        self.db = None
        self.embeddings = None
        
        if LIBRARIES_AVAILABLE:
            try:
                # Use a lightweight SentenceTransformers model
                self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
                self.load_index()
            except Exception as e:
                logger.error(f"Error initializing RAG embeddings: {str(e)}")
                
    def load_index(self):
        if os.path.exists(self.index_path) and self.embeddings:
            try:
                self.db = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
                logger.info("Successfully loaded FAISS index.")
            except Exception as e:
                logger.error(f"Error loading FAISS index: {str(e)}")
                
    def build_index(self):
        if not LIBRARIES_AVAILABLE or not self.embeddings:
            logger.warning("Cannot build vector index: RAG libraries are not available. RAG will operate in keyword matching fallback.")
            return
            
        if not os.path.exists(self.docs_dir):
            os.makedirs(self.docs_dir)
            self._create_default_docs()
            
        documents = []
        for filename in os.listdir(self.docs_dir):
            if filename.endswith(".txt"):
                filepath = os.path.join(self.docs_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                        documents.append(content)
                except Exception as e:
                    logger.error(f"Error reading {filename} for index: {str(e)}")
                    
        if not documents:
            logger.warning("No documents found in knowledge base docs directory to index.")
            # Seed default docs and try again
            self._create_default_docs()
            for filename in os.listdir(self.docs_dir):
                if filename.endswith(".txt"):
                    filepath = os.path.join(self.docs_dir, filename)
                    with open(filepath, "r", encoding="utf-8") as f:
                        documents.append(f.read())
                        
        if not documents:
            return
            
        try:
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=40)
            chunks = text_splitter.create_documents(documents)
            
            self.db = FAISS.from_documents(chunks, self.embeddings)
            self.db.save_local(self.index_path)
            logger.info("FAISS Vector Database built and saved successfully.")
        except Exception as e:
            logger.error(f"Error building FAISS index: {str(e)}")
        
    def _create_default_docs(self):
        os.makedirs(self.docs_dir, exist_ok=True)
        # We will write the files directly in a seeding script, but add a fallback here too.
        who_path = os.path.join(self.docs_dir, "who_guidelines.txt")
        if not os.path.exists(who_path):
            with open(who_path, "w", encoding="utf-8") as f:
                f.write("WHO Guidelines: Chest pain can represent cardiovascular emergency. Stroke symptoms require urgent care. Symptoms of stroke include facial drooping, arm weakness, and speech difficulty. Malaria is mosquito-borne causing recurrent fever. Prevent malaria using nets, repellant.")
                
    def _fallback_keyword_search(self, query: str) -> str:
        """
        Fallback keyword-based search over documents when FAISS / SentenceTransformers are unavailable.
        """
        if not os.path.exists(self.docs_dir):
            return "No local clinical knowledge base found."
            
        matches = []
        words = [w.lower() for w in query.split() if len(w) > 3]
        
        for filename in os.listdir(self.docs_dir):
            if filename.endswith(".txt"):
                filepath = os.path.join(self.docs_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        for line in lines:
                            line_lower = line.lower()
                            if any(word in line_lower for word in words):
                                matches.append(line.strip())
                                if len(matches) >= 5:
                                    break
                except Exception:
                    pass
                    
        if matches:
            return "\n".join(matches)
        return "Generic health guidance: Maintain hygiene, consume clean drinking water, and consult a physician for persistent symptoms."

    def retrieve(self, query: str, k: int = 3) -> str:
        if not LIBRARIES_AVAILABLE or not self.db:
            return self._fallback_keyword_search(query)
            
        try:
            docs = self.db.similarity_search(query, k=k)
            context = "\n".join([doc.page_content for doc in docs])
            return context
        except Exception as e:
            logger.error(f"RAG retrieval error: {str(e)}")
            return self._fallback_keyword_search(query)

rag_service = RAGService()
