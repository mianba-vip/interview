# Web 静态服务镜像：nginx 直接服务 web-image/web 下的静态内容。
#
# 背景：SPA 已拆分到独立仓库 mianba-web（其 deploy/deploy-web.sh 构建后上传到
# 服务器 /opt/mianba/web-image/web/app）；官网落地页（official-site/）由本仓库
# deploy/deploy-local.sh 上传到 web-image/web/；APK 下载由 mianba-mobile 仓库维护
# 到 web-image/web/download/。本镜像只做"静态内容 + nginx 同源 /api 反代"，
# 不再在镜像内构建前端（旧 Dockerfile.web 的 COPY frontend/ 在拆库后已断链）。
#
# 构建上下文必须是服务器上的 web-image/ 目录（含 nginx.conf 与 web/ 静态树），
# 由 deploy/deploy-local.sh 上传同步（nginx.conf 与本 Dockerfile 一并上传）。
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY web/ /usr/share/nginx/html/
# 证书不入镜像：由 compose 从宿主机 web-image/certs/ 只读挂载到 /etc/nginx/certs/
EXPOSE 80 443
