import fitz  # PyMuPDF
import docx  # python-docx
from io import BytesIO

class DocumentExtractor:
    """Service to handle text extraction from candidate resumes (PDF or DOCX format)."""

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract plain text from PDF file bytes using PyMuPDF (fitz)."""
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}") from e

    def extract_text_from_docx(self, file_bytes: bytes) -> str:
        """Extract plain text from Word (DOCX) file bytes using python-docx."""
        try:
            doc = docx.Document(BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            return "\n".join(paragraphs).strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}") from e

    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """Extract text from file bytes based on the filename extension or content type."""
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            return self.extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            return self.extract_text_from_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported file format for extraction: {ext}")
