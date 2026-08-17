import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // db.json은 json-server가 저장할 때마다 다시 쓰는 파일이다.
      // Vite가 이걸 소스 변경으로 감지해 전체 페이지를 새로고침해버리면
      // 노트를 저장할 때마다(개발 중이든 E2E든) 클라이언트 상태가 통째로 날아간다.
      ignored: ['**/db.json'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
