import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 手机真机预览：npm run dev（--host 已内置）→ 手机同 Wi-Fi 打开终端里的局域网地址。
// /api 经 vite 代理直连线上后端，开发期零 CORS 配置。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  base: './',
  server: {
    host: true,
    // Windows 下 chokidar 偶发漏文件事件（热更新出旧代码），改轮询兜底
    watch: { usePolling: true, interval: 400 },
    proxy: {
      '/api': {
        target: 'http://103.236.92.40:23333', // 直连源站：绕过 EdgeOne 回源链路（实测每次请求多 0.7~1.5s）
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
