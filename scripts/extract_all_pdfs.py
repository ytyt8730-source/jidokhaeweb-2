#!/usr/bin/env python3
"""
모든 PDF 파일을 텍스트로 추출하여 파일로 저장
"""

import os
import fitz  # PyMuPDF

def extract_pdf_to_text(pdf_path, output_path):
    """PDF에서 텍스트 추출하여 파일로 저장"""
    try:
        doc = fitz.open(pdf_path)
        text = f"# PDF 텍스트 추출 결과\n\n"
        text += f"**원본 파일:** {os.path.basename(pdf_path)}\n"
        text += f"**총 페이지 수:** {len(doc)}\n\n"
        text += "---\n\n"
        
        for page_num, page in enumerate(doc, 1):
            text += f"## 페이지 {page_num}\n\n"
            page_text = page.get_text()
            text += page_text + "\n\n"
            text += "---\n\n"
        
        doc.close()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"✅ 완료: {output_path}")
        return True
    except Exception as e:
        print(f"❌ 오류: {pdf_path} - {str(e)}")
        return False

def main():
    # PDF 파일 목록
    pdf_files = [
        (r"C:\Users\yt873\OneDrive\문서\1. Project\Modulabs\W01-2_서비스 개요 정립.pdf", 
         r"C:\jidokhae-web2\reference\W01-2_서비스개요정립.md"),
        (r"C:\Users\yt873\OneDrive\문서\1. Project\Modulabs\W02-1_PRD 작성하기.pdf",
         r"C:\jidokhae-web2\reference\W02-1_PRD작성하기.md"),
        (r"C:\Users\yt873\OneDrive\문서\1. Project\Modulabs\W02-2_기술 스택과 시스템 구조.pdf",
         r"C:\jidokhae-web2\reference\W02-2_기술스택과시스템구조.md"),
    ]
    
    # reference 폴더 생성
    os.makedirs(r"C:\jidokhae-web2\reference", exist_ok=True)
    
    print("PDF 텍스트 추출 시작...\n")
    
    for pdf_path, output_path in pdf_files:
        if os.path.exists(pdf_path):
            extract_pdf_to_text(pdf_path, output_path)
        else:
            print(f"⚠️ 파일 없음: {pdf_path}")
    
    print("\n완료!")

if __name__ == "__main__":
    main()
