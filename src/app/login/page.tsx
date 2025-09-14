// 'use client'
// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// export default function LoginPage() {
//   const [email, setEmail] = useState('admin@example.com')
//   const [password, setPassword] = useState('admin123')
//   const router = useRouter()

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     // TODO: nanti sambungin ke NextAuth
//     router.push('/dashboard')
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
//       <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
//         <h1 className="text-2xl font-bold text-center mb-6">🔐 Pentest Dashboard</h1>
//         <form onSubmit={onSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium mb-1">Email</label>
//             <input
//               className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="admin@example.com"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Password</label>
//             <input
//               className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="••••••••"
//               type="password"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//             />
//           </div>
//           <button
//             className="w-full rounded-lg px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
//           >
//             Masuk
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const search = useSearchParams()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.error || 'Login gagal')
      }
      const next = search.get('next') || '/projects'
      router.push(next)
    } catch (err:any) {
      setError(err.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Masuk</h1>
        <p className="text-sm text-gray-500 mb-6">Gunakan akun yang sudah terdaftar.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            className="w-full rounded-xl px-4 py-2 bg-black text-white font-medium hover:opacity-90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
