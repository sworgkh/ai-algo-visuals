import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// HashRouter (not BrowserRouter): deep links live under `#`, so refreshing
// /#/topic/hmm never hits the server as a path — it works on any static host
// (incl. AWS Amplify) with zero rewrite/redirect config. `?tab=`/`?step=`/`?ex=`
// query params still work (they sit after the hash). See amplify.yml notes.
import { HashRouter, Route, Routes } from 'react-router-dom'

// Vendored fonts + math CSS (bundled — no external requests, stays fully static).
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import 'katex/dist/katex.min.css'
import './index.css'

import { App } from './App'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { TopicRoute } from '@/components/TopicRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="topic/:slug" element={<TopicRoute />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
