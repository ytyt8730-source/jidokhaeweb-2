#!/usr/bin/env python3
"""
PDF 텍스트 추출 스크립트
PyMuPDF(fitz)를 사용하여 PDF에서 텍스트를 추출합니다.
"""

import sys
import os

def extract_text_with_pymupdf(pdf_path):
    """PyMuPDF를 사용하여 PDF에서 텍스트 추출"""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        text = ""
        for page_num, page in enumerate(doc, 1):
            text += f"\n{'='*60}\n페이지 {page_num}\n{'='*60}\n"
            text += page.get_text()
        doc.close()
        return text
    except ImportError:
        return None
    except Exception as e:
        return f"PyMuPDF 오류: {str(e)}"

def extract_text_with_pypdf2(pdf_path):
    """PyPDF2를 사용하여 PDF에서 텍스트 추출"""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        for page_num, page in enumerate(reader.pages, 1):
            text += f"\n{'='*60}\n페이지 {page_num}\n{'='*60}\n"
            text += page.extract_text() or ""
        return text
    except ImportError:
        return None
    except Exception as e:
        return f"PyPDF2 오류: {str(e)}"

def extract_text_with_pdfminer(pdf_path):
    """pdfminer.six를 사용하여 PDF에서 텍스트 추출"""
    try:
        from pdfminer.high_level import extract_text
        return extract_text(pdf_path)
    except ImportError:
        return None
    except Exception as e:
        return f"pdfminer 오류: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("사용법: python extract_pdf_text.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"파일을 찾을 수 없습니다: {pdf_path}")
        sys.exit(1)
    
    print(f"PDF 파일 처리 중: {pdf_path}")
    print(f"파일 크기: {os.path.getsize(pdf_path)} bytes")
    print("-" * 60)
    
    # PyMuPDF 시도
    text = extract_text_with_pymupdf(pdf_path)
    if text and not text.startswith("PyMuPDF 오류"):
        print(text)
        return
    
    # PyPDF2 시도
    text = extract_text_with_pypdf2(pdf_path)
    if text and not text.startswith("PyPDF2 오류"):
        print(text)
        return
    
    # pdfminer 시도
    text = extract_text_with_pdfminer(pdf_path)
    if text and not text.startswith("pdfminer 오류"):
        print(text)
        return
    
    print("PDF 라이브러리가 설치되어 있지 않습니다.")
    print("다음 중 하나를 설치해주세요:")
    print("  pip install PyMuPDF")
    print("  pip install PyPDF2")
    print("  pip install pdfminer.six")

if __name__ == "__main__":
    main()
