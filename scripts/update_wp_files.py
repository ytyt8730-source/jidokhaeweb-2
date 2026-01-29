import os
import re

wp_dir = r'C:\jidokhae-web2\roadmap\work-packages'
files = os.listdir(wp_dir)

for filename in files:
    if filename == 'README.md':
        continue
    
    file_path = os.path.join(wp_dir, filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 날짜 업데이트
    if '2026-01-28' in content:
        content = content.replace('2026-01-28', '2026-01-29')
        print(f"Updated date in {filename}")
        
    # 2. M2 특정 수정
    if filename == 'WP-M2-계좌이체신청.md':
        # expires_at -> deposit_deadline
        if 'expires_at' in content:
            content = content.replace('expires_at', 'deposit_deadline')
            print(f"Updated expires_at to deposit_deadline in {filename}")
        
        # waiting 상태 저장 -> waitlists 테이블 저장
        if 'waiting 상태 저장' in content:
            content = content.replace('waiting 상태 저장', 'waitlists 테이블 저장')
            print(f"Updated waiting status to waitlists table in {filename}")
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("All WP files updated.")
