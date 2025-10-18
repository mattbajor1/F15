import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface InventoryItem {
  id: string
  name: string
  type: string
  status: string
  dailyRate: number
  currentProject?: string
  serialNumber?: string
  purchaseDate?: string
  condition?: string
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('All')

  const loadInventory = async () => {
    try {
      setLoading(true)
      const data = await api('/inventory')
      setItems(data)
    } catch (err) {
      console.error('Failed to load inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const filteredItems = filter === 'All' ? items : items.filter(i => i.status === filter)

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'Available').length,
    inUse: items.filter(i => i.status === 'In Use').length,
    maintenance: items.filter(i => i.status === 'Maintenance').length,
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold'>Inventory</h1>
          <p className='text-slate-400 mt-1'>Manage your equipment and resources</p>
        </div>
        <button onClick={() => setShowAdd(true)} className='px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90'>
          + Add Equipment
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <StatCard label='Total Items' value={stats.total} color='bg-slate-700' />
        <StatCard label='Available' value={stats.available} color='bg-green-600' />
        <StatCard label='In Use' value={stats.inUse} color='bg-blue-600' />
        <StatCard label='Maintenance' value={stats.maintenance} color='bg-yellow-600' />
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-2 mb-4 border-b border-slate-800'>
        {['All', 'Available', 'In Use', 'Maintenance'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-t-lg ${filter === f ? 'bg-slate-800 text-white border-x border-t border-slate-800' : 'text-slate-400 hover:text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className='text-center py-8'>Loading inventory...</div>
      ) : filteredItems.length === 0 ? (
        <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center'>
          <div className='text-slate-400'>No equipment found. Add your first item to get started!</div>
        </div>
      ) : (
        <div className='rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-slate-800/50'>
              <tr>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Name</th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Type</th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Status</th>
                <th className='px-4 py-3 text-right text-sm font-semibold'>Daily Rate</th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Condition</th>
                <th className='px-4 py-3 text-right text-sm font-semibold'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <InventoryRow key={item.id} item={item} onUpdate={loadInventory} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={loadInventory} />}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-4'>
      <div className='text-slate-400 text-sm'>{label}</div>
      <div className='flex items-baseline gap-2 mt-1'>
        <div className='text-2xl font-semibold'>{value}</div>
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
      </div>
    </div>
  )
}

function InventoryRow({ item, onUpdate }: { item: InventoryItem; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)

  const statusColors: Record<string, string> = {
    Available: 'bg-green-600/20 text-green-300',
    'In Use': 'bg-blue-600/20 text-blue-300',
    Maintenance: 'bg-yellow-600/20 text-yellow-300',
  }

  const handleDelete = async () => {
    if (!confirm('Delete this equipment?')) return
    try {
      await api(`/inventory/${item.id}`, { method: 'DELETE' })
      onUpdate()
    } catch (err) {
      console.error('Failed to delete item:', err)
      alert('Failed to delete item')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api(`/inventory/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...item, status: newStatus }),
      })
      onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  return (
    <tr className='border-t border-slate-800 hover:bg-slate-800/30'>
      <td className='px-4 py-3'>
        <div className='font-medium'>{item.name}</div>
        {item.serialNumber && <div className='text-xs text-slate-400'>SN: {item.serialNumber}</div>}
      </td>
      <td className='px-4 py-3 text-slate-300'>{item.type}</td>
      <td className='px-4 py-3'>
        <select
          value={item.status}
          onChange={e => handleStatusChange(e.target.value)}
          className={`px-2 py-1 rounded-full text-xs ${statusColors[item.status] || ''} bg-transparent border-0`}
        >
          <option value='Available'>Available</option>
          <option value='In Use'>In Use</option>
          <option value='Maintenance'>Maintenance</option>
        </select>
      </td>
      <td className='px-4 py-3 text-right text-slate-300'>${item.dailyRate.toFixed(2)}</td>
      <td className='px-4 py-3 text-slate-300'>{item.condition || 'Good'}</td>
      <td className='px-4 py-3 text-right'>
        <button onClick={handleDelete} className='text-red-400 hover:text-red-300 text-sm'>
          Delete
        </button>
      </td>
    </tr>
  )
}

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Camera',
    status: 'Available',
    dailyRate: 0,
    serialNumber: '',
    condition: 'Good',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api('/inventory', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      onClose()
      onAdd()
    } catch (err) {
      console.error('Failed to add equipment:', err)
      alert('Failed to add equipment')
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={onClose}>
      <div className='bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-md w-full' onClick={e => e.stopPropagation()}>
        <h2 className='text-xl font-semibold mb-4'>Add Equipment</h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-slate-400 text-sm mb-1'>Equipment Name</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              placeholder='e.g., Canon C70 Camera'
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-slate-400 text-sm mb-1'>Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              >
                <option>Camera</option>
                <option>Lens</option>
                <option>Lighting</option>
                <option>Audio</option>
                <option>Grip</option>
                <option>Drone</option>
                <option>Monitor</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className='block text-slate-400 text-sm mb-1'>Daily Rate ($)</label>
              <input
                type='number'
                required
                min='0'
                step='0.01'
                value={formData.dailyRate}
                onChange={e => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-slate-400 text-sm mb-1'>Serial Number</label>
              <input
                value={formData.serialNumber}
                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
                placeholder='Optional'
              />
            </div>
            <div>
              <label className='block text-slate-400 text-sm mb-1'>Condition</label>
              <select
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              >
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Needs Repair</option>
              </select>
            </div>
          </div>
          <div className='flex gap-2 justify-end pt-2'>
            <button type='button' onClick={onClose} className='px-4 py-2 rounded-lg border border-slate-700'>
              Cancel
            </button>
            <button type='submit' className='px-4 py-2 rounded-lg bg-brand text-white'>
              Add Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
