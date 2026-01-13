import { useState, useCallback } from 'react'

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

  const testConnection = useCallback(async () => {
    setConnectionStatus('loading')
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus('success')
        setConnectionMessage(data.message || 'Connected successfully!')
      } else {
        throw new Error('Connection failed')
      }
    } catch {
      setConnectionStatus('error')
      setConnectionMessage('Failed to connect to backend')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Main Content */}
      <main className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 animate-pulse">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Welcome to <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{'BudgetingFE'}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg mb-8">
          Connected to <strong className="text-white">{'BudgetingBE'}</strong> backend
        </p>

        {/* Connection Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'success' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
              connectionStatus === 'error' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
              connectionStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'
            }`}></div>
            <span className="text-slate-300 font-medium">Backend Connection</span>
          </div>

          <div className="space-y-4">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span>Endpoint:</span>
              <code className="px-2 py-1 bg-slate-900/50 rounded text-indigo-400 text-xs">http://localhost:{'5008'}/api/health</code>
            </p>

            {/* Test Button */}
            <button
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                         text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              onClick={testConnection}
              disabled={connectionStatus === 'loading'}
            >
              {connectionStatus === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Testing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Test Connection
                </>
              )}
            </button>

            {/* Result Message */}
            {connectionStatus !== 'idle' && connectionStatus !== 'loading' && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                connectionStatus === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {connectionStatus === 'success' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                <span className="text-sm font-medium">{connectionMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">React 19</span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium border border-purple-500/20">.NET 10</span>
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium border border-cyan-500/20">Tailwind CSS</span>
        </div>
      </main>
    </div>
  )
}

export default App
