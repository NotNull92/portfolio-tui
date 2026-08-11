import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// FX 강도를 렌더 전에 복원 — 부팅 화면(터미널)도 저장된 강도를 따르고,
// COMFORT 사용자가 첫 페인트에서 풀 CRT 를 번쩍 보는 일이 없게 한다
try {
  document.documentElement.dataset.fx =
    localStorage.getItem('tui-fx') === 'max' ? 'max' : 'comfort'
} catch {
  document.documentElement.dataset.fx = 'comfort'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
