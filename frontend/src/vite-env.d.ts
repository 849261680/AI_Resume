/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // 在这里添加更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 