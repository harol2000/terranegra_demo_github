import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { DemoProvider } from './demoContext'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </HashRouter>
  </StrictMode>,
)
