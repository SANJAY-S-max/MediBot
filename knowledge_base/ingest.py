import os
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from vector_db.chroma_store import vector_db_manager

# Configure the directory where raw documents are stored
DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "documents")

def load_document(file_path: str):
    """Load a document based on its file extension."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(file_path)
    elif ext in [".txt", ".md"]:
        loader = TextLoader(file_path, encoding='utf-8')
    elif ext == ".csv":
        loader = CSVLoader(file_path)
    else:
        print(f"Unsupported file type: {ext}")
        return []
    
    try:
        docs = loader.load()
        # Add basic metadata
        for doc in docs:
            doc.metadata['source_file'] = os.path.basename(file_path)
            doc.metadata['file_type'] = ext
        return docs
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

def split_documents(documents):
    """Split documents into chunks using RecursiveCharacterTextSplitter."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    return text_splitter.split_documents(documents)

def ingest_directory(directory: str = DOCUMENTS_DIR):
    """Load all documents in the directory, chunk them, and add to Vector DB."""
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Created directory {directory}. Please add documents.")
        return

    all_docs = []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            print(f"Processing {filename}...")
            docs = load_document(file_path)
            all_docs.extend(docs)

    if not all_docs:
        print("No documents found or processed.")
        return

    print(f"Loaded {len(all_docs)} pages/sections. Chunking...")
    chunks = split_documents(all_docs)
    
    print(f"Created {len(chunks)} chunks. Ingesting to ChromaDB...")
    vector_db_manager.add_documents(chunks)
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest_directory()
