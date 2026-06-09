import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import { ApiProvider } from './lib/apiProvider.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ApiProvider>
  </React.StrictMode>,
)
