from fastapi import UploadFile, HTTPException
import PyPDF2
from docx import Document
import io

async def extract_text_from_file(file: UploadFile) -> str:
    if file.content_type == "text/plain":
        content = await file.read()
        return content.decode("utf-8")
        
    elif file.content_type == "application/pdf":
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
        
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        content = await file.read()
        doc = Document(io.BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
        
    else:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Please upload .txt, .pdf, or .docx"
        )
