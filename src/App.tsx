import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import GlobalSearch from './components/GlobalSearch'
import Home from './routes/Home'

// Route pages are code-split so the initial bundle stays lean.
const Catalog = lazy(() => import('./routes/Catalog'))
const ArchitectureDetail = lazy(() => import('./routes/ArchitectureDetail'))
const UseCase = lazy(() => import('./routes/UseCase'))
const Build = lazy(() => import('./routes/Build'))
const Review = lazy(() => import('./routes/Review'))
const Compose = lazy(() => import('./routes/Compose'))
const Playground = lazy(() => import('./routes/Playground'))
const Accuracy = lazy(() => import('./routes/Accuracy'))
const FailureModes = lazy(() => import('./routes/FailureModes'))
const Security = lazy(() => import('./routes/Security'))
const Evaluate = lazy(() => import('./routes/Evaluate'))
const Notebooks = lazy(() => import('./routes/Notebooks'))
const NotebookView = lazy(() => import('./routes/NotebookView'))
const StrandsAtlas = lazy(() => import('./routes/StrandsAtlas'))
const AgentCoreAtlas = lazy(() => import('./routes/AgentCoreAtlas'))
const RetrievalAtlas = lazy(() => import('./routes/RetrievalAtlas'))
const Videos = lazy(() => import('./routes/Videos'))
const UseCases = lazy(() => import('./routes/UseCases'))
const Updates = lazy(() => import('./routes/Updates'))

/** Reset scroll position on route change (except for in-page anchors). */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function RouteFallback() {
  return (
    <div className="mx-auto max-w-content px-4 py-24 text-center text-sm text-ink-muted sm:px-6">
      Loading…
    </div>
  )
}

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-ink">
      <AppHeader />
      <GlobalSearch />
      <ScrollToTop />

      {/* Offset content so it never hides under the sticky header. */}
      <main className="flex-1 pt-[var(--header-height)]">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            {/* Family-scoped catalog; /catalog alone falls back to RAG. */}
            <Route path="/catalog/:family" element={<Catalog />} />
            <Route path="/architecture/:id" element={<ArchitectureDetail />} />
            <Route path="/use-case" element={<UseCase />} />
            <Route path="/build" element={<Build />} />
            <Route path="/review" element={<Review />} />
            {/* Old route kept as a redirect. */}
            <Route path="/diagnose" element={<Navigate to="/review" replace />} />
            <Route path="/compose" element={<Compose />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/accuracy" element={<Accuracy />} />
            <Route path="/failure-modes" element={<FailureModes />} />
            <Route path="/security" element={<Security />} />
            <Route path="/evaluate" element={<Evaluate />} />
            <Route path="/notebooks" element={<Notebooks />} />
            <Route path="/notebooks/:id" element={<NotebookView />} />
            <Route path="/strands" element={<StrandsAtlas />} />
            <Route path="/strands/:topicId" element={<StrandsAtlas />} />
            <Route path="/agentcore" element={<AgentCoreAtlas />} />
            <Route path="/agentcore/:topicId" element={<AgentCoreAtlas />} />
            <Route path="/retrieval" element={<RetrievalAtlas />} />
            <Route path="/retrieval/:topicId" element={<RetrievalAtlas />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/updates" element={<Updates />} />
          </Routes>
        </Suspense>
      </main>

      <AppFooter />
    </div>
  )
}

export default App
