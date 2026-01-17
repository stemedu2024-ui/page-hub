#!/bin/bash

# GitHub 업로드 스크립트

# 프로젝트 폴더로 이동
cd "/c/Users/LCH/OneDrive/바탕 화면/PageHub"

# Git 사용자 정보 설정 (이미 설정되어 있을 수 있음)
git config --global user.name "stemedu2024-ui"
git config --global user.email "stemedu2024-ui@users.noreply.github.com"

# Git 저장소 초기화 (이미 되어있으면 무시됨)
git init

# 원격 저장소 연결 (이미 연결되어 있으면 업데이트)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/stemedu2024-ui/page-hub.git

# 모든 파일 추가
git add .

# 커밋 생성
git commit -m "Initial commit - PageHub project" 2>/dev/null || git commit -m "Update - PageHub project"

# 브랜치를 main으로 변경
git branch -M main

# GitHub에 업로드
git push -u origin main

echo "완료!"
