// Electron preload로 노출되는 API 타입
interface ElectronAPI {
  isElectron: true;
  openFloatTimer: () => Promise<void>;
  closeFloatTimer: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// React CSSProperties에 -webkit-app-region 추가
import 'react';
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag' | 'none';
  }
}
