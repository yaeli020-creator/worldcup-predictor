#!/bin/bash
# GitHub Pages 一键部署
# 用法：GITHUB_USER=用户名 GITHUB_TOKEN=令牌 ./deploy-github.sh

set -euo pipefail
cd "$(dirname "$0")"

: "${GITHUB_USER:?请设置 GITHUB_USER（GitHub 用户名）}"
: "${GITHUB_TOKEN:?请设置 GITHUB_TOKEN（GitHub Personal Access Token，需 repo 权限）}"

REPO_NAME="${GITHUB_REPO:-worldcup-predictor}"
BRANCH="${GITHUB_BRANCH:-master}"
API="https://api.github.com"

auth_hdr=(-H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json")

echo "==> 检查仓库 ${GITHUB_USER}/${REPO_NAME} ..."
if ! curl -fsS "${auth_hdr[@]}" "${API}/repos/${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "==> 创建仓库 ${REPO_NAME} ..."
  curl -fsS -X POST "${auth_hdr[@]}" "${API}/user/repos" \
    -d "{\"name\":\"${REPO_NAME}\",\"description\":\"世界杯预言家 H5 原型\",\"private\":false,\"auto_init\":false}" \
    >/dev/null
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b "${BRANCH}"
fi

git config user.email "${GIT_EMAIL:-${GITHUB_USER}@users.noreply.github.com}"
git config user.name "${GIT_NAME:-${GITHUB_USER}}"

GITHUB_REMOTE="https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
if git remote get-url github >/dev/null 2>&1; then
  git remote set-url github "${GITHUB_REMOTE}"
else
  git remote add github "${GITHUB_REMOTE}"
fi

git add -A
if git diff --cached --quiet; then
  echo "==> 无新变更，跳过提交"
else
  git commit -m "deploy: 部署世界杯预言家到 GitHub Pages"
fi

echo "==> 推送到 GitHub ..."
git push -u github "${BRANCH}" --force

echo "==> 启用 GitHub Pages ..."
curl -fsS -X POST "${auth_hdr[@]}" "${API}/repos/${GITHUB_USER}/${REPO_NAME}/pages" \
  -d "{\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}" \
  >/dev/null 2>&1 || \
curl -fsS -X PUT "${auth_hdr[@]}" "${API}/repos/${GITHUB_USER}/${REPO_NAME}/pages" \
  -d "{\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}" \
  >/dev/null

PAGES_URL="https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
echo "部署完成！"
echo "访问地址：${PAGES_URL}"
echo "主页面：  ${PAGES_URL}worldcup-predictor.html"
echo "（首次部署约需 1-3 分钟生效）"
