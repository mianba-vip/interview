# Web 静态服务镜像：nginx 直接服务 web-image/web 下的静态内容。
# 仅用于 legacy-web 回退或旧机过渡入口；当前前端机使用 mianba-web/deploy/nginx.conf。
#
# 新前端在 106.14.143.151 使用宿主机 Nginx，本镜像不再承载新版本产物。
# 旧机仍保留静态树供回退；过渡期替换 nginx.conf 为 nginx-container-entry.conf，
# 使仍回源旧机 18080 端口的 EdgeOne 请求通过 HTTPS 转发到新前端。
#
# 构建上下文必须是服务器上的 web-image/ 目录（含 nginx.conf 与 web/ 静态树），
# 由运维手动准备；后端 deploy-local.sh 不再上传或构建 Web。
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY web/ /usr/share/nginx/html/
# 证书不入镜像：由 compose 从宿主机 web-image/certs/ 只读挂载到 /etc/nginx/certs/
EXPOSE 80 443
