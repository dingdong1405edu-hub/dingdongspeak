'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Trash2, Shield, Edit3, Crown, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface StaffUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
  role: string
  createdAt: string
}

const ROLE_META = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-violet-400 bg-violet-500/15 border-violet-500/30' },
  STAFF: { label: 'Staff', icon: Edit3, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
  OWNER: { label: 'Owner', icon: Crown, color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN'>('STAFF')
  const [adding, setAdding] = useState(false)
  const [roleMenuId, setRoleMenuId] = useState<string | null>(null)

  async function fetchStaff() {
    const res = await fetch('/api/admin/staff')
    const data = await res.json()
    setStaff(data.staff ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  async function handleAdd() {
    if (!email.trim()) { toast.error('Nhập email'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Đã cấp quyền ${newRole} cho ${email}`)
      setEmail('')
      fetchStaff()
    } catch (e: any) {
      toast.error(e?.message || 'Thất bại')
    } finally {
      setAdding(false)
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    setRoleMenuId(null)
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Thất bại')
      toast.success('Đã cập nhật quyền')
      setStaff(s => s.map(u => u.id === userId ? { ...u, role } : u))
    } catch (e: any) {
      toast.error(e?.message)
    }
  }

  async function handleRevoke(userId: string, userEmail: string) {
    if (!confirm(`Thu hồi quyền của ${userEmail}?`)) return
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Thất bại')
      toast.success('Đã thu hồi quyền')
      setStaff(s => s.filter(u => u.id !== userId))
    } catch (e: any) {
      toast.error(e?.message)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Quản lý nhân viên</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Cấp quyền để nhân viên đăng nhập và chỉnh sửa bài học. Họ phải đăng nhập Google ít nhất 1 lần.
        </p>
      </div>

      {/* Grant access */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-cyan-400" />
          <h2 className="font-semibold text-[var(--text)]">Cấp quyền mới</h2>
        </div>
        <div className="flex gap-3">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="email@gmail.com"
            className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'STAFF' | 'ADMIN')}
            className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
          >
            <option value="STAFF">Staff — Chỉnh sửa bài học</option>
            <option value="ADMIN">Admin — Toàn quyền</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Cấp quyền
          </button>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text)]">Lưu ý:</strong> Người dùng phải đăng nhập bằng Google ít nhất 1 lần trước khi bạn cấp quyền.
          Staff chỉ có thể chỉnh sửa bài học. Admin có thêm quyền quản lý nhân viên khác.
        </div>
      </div>

      {/* Staff list */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
          <Users size={18} className="text-[var(--text-secondary)]" />
          <h2 className="font-semibold text-[var(--text)]">Danh sách nhân viên ({staff.length})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có nhân viên nào được cấp quyền</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {staff.map(user => {
              const roleMeta = ROLE_META[user.role as keyof typeof ROLE_META]
              const RoleIcon = roleMeta?.icon ?? Shield
              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0 text-white text-sm font-bold overflow-hidden">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (user.name?.[0] ?? user.email[0]).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text)] truncate">{user.name ?? '(Chưa có tên)'}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">{user.email}</div>
                  </div>

                  {/* Role badge + change */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setRoleMenuId(roleMenuId === user.id ? null : user.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all hover:opacity-80 ${roleMeta?.color ?? 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border-[var(--border)]'}`}
                    >
                      <RoleIcon size={12} />
                      {roleMeta?.label ?? user.role}
                      <ChevronDown size={10} />
                    </button>

                    {roleMenuId === user.id && (
                      <div className="absolute right-0 top-full mt-1 z-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                        {(['STAFF', 'ADMIN'] as const).map(r => (
                          <button key={r} onClick={() => handleChangeRole(user.id, r)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--bg-secondary)] transition-colors text-left ${user.role === r ? 'text-cyan-400 font-semibold' : 'text-[var(--text)]'}`}>
                            {r === 'ADMIN' ? <Shield size={14} /> : <Edit3 size={14} />}
                            {r === 'STAFF' ? 'Staff' : 'Admin'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revoke */}
                  <button
                    onClick={() => handleRevoke(user.id, user.email)}
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
                    title="Thu hồi quyền"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
