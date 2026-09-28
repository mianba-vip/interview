import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 手机真机预览：npm run dev（--host 已内置）→ 手机同 Wi-Fi 打开终端里的局域网地址。
// /api 经 vite 代理直连线上后端，开发期零 CORS 配置。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://mianba.vip',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
