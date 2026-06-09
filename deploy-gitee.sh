#!/bin/bash
# Gitee Pages 一键部署
# 用法：GITEE_USER=你的用户名 GITEE_TOKEN=你的私人令牌 ./deploy-gitee.sh

set -euo pipefail
cd "$(dirname "$0")"

: "${GITEE_USER:?请设置 GITEE_USER（Gitee 用户名）}"
: "${GITEE_TOKEN:?请设置 GITEE_TOKEN（Gitee 私人令牌）}"

REPO_NAME="${GITEE_REPO:-worldcup-predictor}"
BRANCH="${GITEE_BRANCH:-master}"
API="https://gitee.com/api/v5"

echo "==> 检查远程仓库 ${GITEE_USER}/${REPO_NAME} ..."
if ! curl -fsS "${API}/repos/${GITEE_USER}/${REPO_NAME}?access_token=${GITEE_TOKEN}" >/dev/null 2>&1; then
  echo "==> 创建仓库 ${REPO_NAME} ..."
  curl -fsS -X POST "${API}/user/repos?access_token=${GITEE_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"${REPO_NAME}\",\"description\":\"世界杯预言家 H5 原型\",\"private\":false,\"has_issues\":false,\"has_wiki\":false}" \
    >/dev/null
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b "${BRANCH}"
fi

git config user.email "${GIT_EMAIL:-${GITEE_USER}@users.noreply.gitee.com}"
git config user.name "${GIT_NAME:-${GITEE_USER}}"

REMOTE="https://${GITEE_USER}:${GITEE_TOKEN}@gitee.com/${GITEE_USER}/${REPO_NAME}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${REMOTE}"
else
  git remote add origin "${REMOTE}"
fi

git add -A
if git diff --cached --quiet; then
  echo "==> 无新变更，跳过提交"
else
  git commit -m "deploy: 部署世界杯预言家到 Gitee Pages"
fi

echo "==> 推送到 Gitee ..."
git push -u origin "${BRANCH}" --force

echo "==> 启动 Gitee Pages ..."
curl -fsS -X POST "${API}/repos/${GITEE_USER}/${REPO_NAME}/pages?access_token=${GITEE_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"branch\":\"${BRANCH}\",\"build_directory\":\"/\",\"force_https\":true}" \
  >/dev/null || \
curl -fsS -X PUT "${API}/repos/${GITEE_USER}/${REPO_NAME}/pages?access_token=${GITEE_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"branch\":\"${BRANCH}\",\"build_directory\":\"/\",\"force_https\":true}" \
  >/dev/null

PAGES_URL="https://${GITEE_USER}.gitee.io/${REPO_NAME}/"
echo ""
echo "部署完成！"
echo "访问地址：${PAGES_URL}"
echo "主页面：  ${PAGES_URL}worldcup-predictor.html"
