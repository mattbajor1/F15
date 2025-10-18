import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { storage } from '../lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

interface Project {
  id: string
  name: string
  client: string
  type: string
  status: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

interface Task {
  id: string
  title: string
  status: string
  dueDate?: string
  assignedTo?: string
}

interface Equipment {
  id: string
  name: string
  type: string
  dailyRate: number
  assignedDate?: string
}

interface MarketingCampaign {
  id: string
  platform: string
  content: string
  status: string
  scheduledDate?: string
  postedDate?: string
}

interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  discount: number
  taxRate: number
  total: number
  notes?: string
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  storagePath: string
  uploadedAt: string
  uploadedBy: string
}

function Tabs({ value, onChange, tabs }: { value: string; onChange: (v: string) => void; tabs: { id: string; label: string }[] }) {
  return (
    <div className='flex gap-2 border-b border-slate-800 mb-3'>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 rounded-t-lg ${value === t.id ? 'bg-slate-800 text-white border-x border-t border-slate-800' : 'text-slate-400 hover:text-white'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('details')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${id}`)
      setProject(data)
    } catch (err) {
      console.error('Failed to load project:', err)
      alert('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [id])

  if (loading) return <div className='max-w-6xl mx-auto p-6'>Loading...</div>
  if (!project) return <div className='max-w-6xl mx-auto p-6'>Project not found</div>

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <button onClick={() => navigate('/projects')} className='text-slate-400 hover:text-white mb-2'>
            ← Back to Projects
          </button>
          <h1 className='text-2xl font-semibold'>{project.name}</h1>
          <div className='text-xs text-slate-400 uppercase tracking-widest mt-1'>{project.status}</div>
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'equipment', label: 'Equipment' },
          { id: 'marketing', label: 'Marketing' },
          { id: 'invoicing', label: 'Invoicing' },
          { id: 'documents', label: 'Documents' },
        ]}
      />
      {tab === 'details' && <DetailsTab project={project} onUpdate={loadProject} />}
      {tab === 'tasks' && <TasksTab projectId={id!} />}
      {tab === 'equipment' && <EquipmentTab projectId={id!} />}
      {tab === 'marketing' && <MarketingTab projectId={id!} />}
      {tab === 'invoicing' && <InvoicingTab projectId={id!} projectName={project.name} />}
      {tab === 'documents' && <DocumentsTab projectId={id!} projectName={project.name} />}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className='rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-4'>{children}</div>
}

function DetailsTab({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    client: project.client,
    type: project.type,
    status: project.status,
    description: project.description || '',
  })

  const handleSave = async () => {
    try {
      await api(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      setEditing(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to update project:', err)
      alert('Failed to update project')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className='space-y-4'>
          <div>
            <label className='block text-slate-400 mb-1'>Project Name</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
            />
          </div>
          <div className='grid md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-slate-400 mb-1'>Client</label>
              <input
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              />
            </div>
            <div>
              <label className='block text-slate-400 mb-1'>Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              >
                <option>Feature Film</option>
                <option>Commercial</option>
                <option>Documentary</option>
                <option>Music Video</option>
                <option>Corporate</option>
              </select>
            </div>
            <div>
              <label className='block text-slate-400 mb-1'>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              >
                <option>Planning</option>
                <option>Pre-production</option>
                <option>Production</option>
                <option>Post-production</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>
            </div>
          </div>
          <div>
            <label className='block text-slate-400 mb-1'>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              rows={4}
            />
          </div>
          <div className='flex gap-2 justify-end'>
            <button onClick={() => setEditing(false)} className='px-4 py-2 rounded-lg border border-slate-700'>
              Cancel
            </button>
            <button onClick={handleSave} className='px-4 py-2 rounded-lg bg-brand text-white'>
              Save Changes
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className='flex justify-between items-start mb-4'>
        <div className='text-xl font-semibold'>Project Details</div>
        <button onClick={() => setEditing(true)} className='px-3 py-1 rounded-lg border border-slate-700 text-sm'>
          Edit
        </button>
      </div>
      <div className='grid md:grid-cols-3 gap-6'>
        <div>
          <div className='text-slate-400'>Client</div>
          <div className='font-semibold'>{project.client}</div>
        </div>
        <div>
          <div className='text-slate-400'>Project Type</div>
          <div className='font-semibold'>{project.type}</div>
        </div>
        <div>
          <div className='text-slate-400'>Status</div>
          <div className='font-semibold'>{project.status}</div>
        </div>
      </div>
      {project.description && (
        <div className='mt-6'>
          <div className='text-slate-400 mb-1'>Description</div>
          <p className='text-slate-300'>{project.description}</p>
        </div>
      )}
    </Card>
  )
}

function TasksTab({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', status: 'To Do', dueDate: '' })

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${projectId}/tasks`)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    try {
      await api(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(newTask),
      })
      setNewTask({ title: '', status: 'To Do', dueDate: '' })
      setShowAdd(false)
      loadTasks()
    } catch (err) {
      console.error('Failed to add task:', err)
      alert('Failed to add task')
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await api(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      loadTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await api(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' })
      loadTasks()
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [projectId])

  if (loading) return <Card>Loading tasks...</Card>

  return (
    <Card>
      <div className='flex justify-between items-center mb-4'>
        <div className='text-xl font-semibold'>Project Tasks</div>
        <button onClick={() => setShowAdd(!showAdd)} className='px-3 py-1 rounded-lg bg-brand text-white text-sm'>
          + Add Task
        </button>
      </div>

      {showAdd && (
        <div className='mb-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700'>
          <div className='grid md:grid-cols-3 gap-3'>
            <div className='md:col-span-2'>
              <input
                placeholder='Task title'
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              />
            </div>
            <div>
              <select
                value={newTask.status}
                onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          <div className='flex gap-2 mt-3'>
            <button onClick={() => setShowAdd(false)} className='px-3 py-1 rounded-lg border border-slate-700 text-sm'>
              Cancel
            </button>
            <button onClick={addTask} disabled={!newTask.title} className='px-3 py-1 rounded-lg bg-brand text-white text-sm disabled:opacity-50'>
              Add
            </button>
          </div>
        </div>
      )}

      <div className='space-y-2'>
        {tasks.length === 0 ? (
          <div className='text-slate-400 text-center py-8'>No tasks yet. Add one to get started!</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className='flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50'>
              <input
                type='checkbox'
                checked={task.status === 'Completed'}
                onChange={e => updateTask(task.id, { status: e.target.checked ? 'Completed' : 'To Do' })}
                className='accent-brand'
              />
              <div className='flex-1'>
                <div className={task.status === 'Completed' ? 'line-through text-slate-500' : ''}>{task.title}</div>
              </div>
              <select
                value={task.status}
                onChange={e => updateTask(task.id, { status: e.target.value })}
                className='px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm'
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <button onClick={() => deleteTask(task.id)} className='text-red-400 hover:text-red-300 text-sm'>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

function EquipmentTab({ projectId }: { projectId: string }) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')

  const loadEquipment = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${projectId}/equipment`)
      setEquipment(data)
    } catch (err) {
      console.error('Failed to load equipment:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      const data = await api('/inventory')
      // Only show available equipment
      setInventory(data.filter((item: any) => item.status === 'Available'))
    } catch (err) {
      console.error('Failed to load inventory:', err)
    }
  }

  const assignEquipment = async () => {
    if (!selectedEquipmentId) return
    const item = inventory.find(i => i.id === selectedEquipmentId)
    if (!item) return

    try {
      await api(`/projects/${projectId}/equipment`, {
        method: 'POST',
        body: JSON.stringify({
          equipmentId: item.id,
          name: item.name,
          type: item.type,
          dailyRate: item.dailyRate,
        }),
      })
      setShowAssign(false)
      setSelectedEquipmentId('')
      loadEquipment()
    } catch (err) {
      console.error('Failed to assign equipment:', err)
      alert('Failed to assign equipment')
    }
  }

  const removeEquipment = async (equipmentId: string) => {
    if (!confirm('Remove this equipment from the project?')) return
    try {
      await api(`/projects/${projectId}/equipment/${equipmentId}`, { method: 'DELETE' })
      loadEquipment()
    } catch (err) {
      console.error('Failed to remove equipment:', err)
    }
  }

  useEffect(() => {
    loadEquipment()
  }, [projectId])

  useEffect(() => {
    if (showAssign) {
      loadInventory()
    }
  }, [showAssign])

  if (loading) return <Card>Loading equipment...</Card>

  return (
    <Card>
      <div className='flex justify-between items-center mb-3'>
        <div className='text-xl font-semibold'>Assigned Equipment</div>
        <button onClick={() => setShowAssign(true)} className='px-3 py-1 rounded-lg bg-brand text-white text-sm'>
          + Assign Equipment
        </button>
      </div>

      {showAssign && (
        <div className='mb-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700'>
          <div className='text-sm font-semibold mb-2'>Select Equipment from Inventory</div>
          <select
            value={selectedEquipmentId}
            onChange={e => setSelectedEquipmentId(e.target.value)}
            className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 mb-3'
          >
            <option value=''>Choose equipment...</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.type} (${item.dailyRate}/day)
              </option>
            ))}
          </select>
          <div className='flex gap-2'>
            <button onClick={() => setShowAssign(false)} className='px-3 py-1 rounded-lg border border-slate-700 text-sm'>
              Cancel
            </button>
            <button onClick={assignEquipment} disabled={!selectedEquipmentId} className='px-3 py-1 rounded-lg bg-brand text-white text-sm disabled:opacity-50'>
              Assign
            </button>
          </div>
        </div>
      )}

      {equipment.length === 0 ? (
        <div className='text-slate-400 text-center py-8'>No equipment assigned yet.</div>
      ) : (
        <table className='w-full'>
          <thead className='text-slate-400'>
            <tr>
              <th className='py-2 text-left'>Name</th>
              <th className='text-left'>Type</th>
              <th className='text-right'>Daily Rate</th>
              <th className='text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map(item => (
              <tr key={item.id} className='border-t border-slate-800'>
                <td className='py-2'>{item.name}</td>
                <td>{item.type}</td>
                <td className='text-right'>${item.dailyRate.toFixed(2)}</td>
                <td className='text-right'>
                  <button onClick={() => removeEquipment(item.id)} className='text-red-400 hover:text-red-300 text-sm'>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function MarketingTab({ projectId }: { projectId: string }) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [loading, setLoading] = useState(true)

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${projectId}/marketing`)
      setCampaigns(data)
    } catch (err) {
      console.error('Failed to load marketing campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [projectId])

  if (loading) return <div className='space-y-4'><Card>Loading campaigns...</Card></div>

  return (
    <div className='space-y-4'>
      <div className='text-xl font-semibold'>Marketing Rollout</div>
      {campaigns.length === 0 ? (
        <Card>
          <div className='text-slate-400 text-center py-8'>No marketing campaigns yet.</div>
        </Card>
      ) : (
        campaigns.map(campaign => (
          <div key={campaign.id} className='rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3'>
            <div className='inline-flex items-center gap-2 text-xs'>
              <span
                className={`${
                  campaign.status === 'Posted' ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'
                } px-2 py-1 rounded-full`}
              >
                {campaign.status}
              </span>
            </div>
            <div className='space-y-2'>
              <div className='italic text-slate-300'>'{campaign.content}'</div>
              <div className='text-slate-400'>Platform: {campaign.platform}</div>
              {campaign.status === 'Scheduled' && campaign.scheduledDate && (
                <div className='text-slate-400'>Scheduled for: {new Date(campaign.scheduledDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function InvoicingTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    taxRate: 8,
    notes: 'Thank you for your business!',
  })

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${projectId}/invoices`)
      setInvoices(data)
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0 }],
    })
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...formData.lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, lineItems: updated })
  }

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const afterDiscount = subtotal - formData.discount
    const tax = afterDiscount * (formData.taxRate / 100)
    return { subtotal, total: afterDiscount + tax }
  }

  const createInvoice = async () => {
    const { subtotal, total } = calculateTotal()
    try {
      await api(`/projects/${projectId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          lineItems: formData.lineItems.map((item, i) => ({ ...item, id: `item-${i}` })),
          subtotal,
          total,
        }),
      })
      setCreating(false)
      setFormData({
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        discount: 0,
        taxRate: 8,
        notes: 'Thank you for your business!',
      })
      loadInvoices()
    } catch (err) {
      console.error('Failed to create invoice:', err)
      alert('Failed to create invoice')
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [projectId])

  if (loading) return <Card>Loading invoices...</Card>

  if (creating) {
    const { subtotal, total } = calculateTotal()
    return (
      <div className='rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-4'>
        <div className='text-right text-brand font-black tracking-[0.3em] mb-4'>NEW INVOICE</div>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <div className='font-semibold'>Frame 15</div>
            <div className='text-slate-400 text-sm'>Los Angeles, CA</div>
          </div>
          <div className='text-right'>
            <div className='text-slate-400 text-sm'>Project</div>
            <div className='text-brand'>{projectName}</div>
          </div>
        </div>
        <div className='grid sm:grid-cols-2 gap-3 mt-4'>
          <div>
            <label className='block text-slate-400 text-sm mb-1'>Invoice #</label>
            <input
              value={formData.invoiceNumber}
              onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
              className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
            />
          </div>
          <div>
            <label className='block text-slate-400 text-sm mb-1'>Date</label>
            <input
              type='date'
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className='w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
            />
          </div>
        </div>
        <div className='mt-4'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-slate-400 text-sm'>Line Items</div>
            <button onClick={addLineItem} className='text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600'>
              + Add Item
            </button>
          </div>
          {formData.lineItems.map((item, i) => (
            <div key={i} className='grid grid-cols-[1fr,80px,100px,40px] gap-2 mb-2'>
              <input
                placeholder='Description'
                value={item.description}
                onChange={e => updateLineItem(i, 'description', e.target.value)}
                className='px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
              />
              <input
                type='number'
                placeholder='Qty'
                value={item.quantity}
                onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 0)}
                className='px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-right'
              />
              <input
                type='number'
                placeholder='Price'
                step='0.01'
                value={item.unitPrice}
                onChange={e => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                className='px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-right'
              />
              <button onClick={() => removeLineItem(i)} className='text-red-400 hover:text-red-300 text-sm'>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className='grid sm:grid-cols-2 gap-4 mt-4'>
          <div>
            <label className='block text-slate-400 text-sm mb-1'>Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className='w-full h-20 px-3 py-2 rounded-md bg-slate-800 border border-slate-700'
            />
          </div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-slate-400'>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className='grid grid-cols-2 gap-2 items-center'>
              <span className='text-slate-400'>Discount ($)</span>
              <input
                type='number'
                step='0.01'
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className='px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-right'
              />
            </div>
            <div className='grid grid-cols-2 gap-2 items-center'>
              <span className='text-slate-400'>Tax (%)</span>
              <input
                type='number'
                step='0.1'
                value={formData.taxRate}
                onChange={e => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className='px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-right'
              />
            </div>
            <div className='flex justify-between font-semibold text-lg pt-2 border-t border-slate-700'>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className='flex gap-2 justify-end mt-4'>
          <button onClick={() => setCreating(false)} className='px-4 py-2 rounded-lg border border-slate-700'>
            Cancel
          </button>
          <button onClick={createInvoice} className='px-4 py-2 rounded-lg bg-brand text-white'>
            Create Invoice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <div className='text-xl font-semibold'>Invoices</div>
        <button onClick={() => setCreating(true)} className='px-3 py-1 rounded-lg bg-brand text-white text-sm'>
          + Create Invoice
        </button>
      </div>
      {invoices.length === 0 ? (
        <Card>
          <div className='text-slate-400 text-center py-8'>No invoices yet. Create your first invoice!</div>
        </Card>
      ) : (
        invoices.map(invoice => (
          <div key={invoice.id} className='rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-4'>
            <div className='text-right text-brand font-black tracking-[0.3em]'>INVOICE</div>
            <div className='grid md:grid-cols-2 gap-4 mt-2'>
              <div>
                <div className='font-semibold'>Frame 15</div>
                <div className='text-slate-400 text-sm'>Los Angeles, CA</div>
              </div>
              <div className='text-right'>
                <div className='text-slate-400 text-sm'>Project</div>
                <div className='text-brand'>{projectName}</div>
              </div>
            </div>
            <div className='grid sm:grid-cols-2 gap-2 mt-4'>
              <div>
                <div className='text-slate-400 text-sm'>Invoice #</div>
                <div>{invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className='text-slate-400 text-sm'>Date</div>
                <div>{new Date(invoice.date).toLocaleDateString()}</div>
              </div>
            </div>
            <div className='mt-4'>
              <div className='text-slate-400 text-sm mb-2'>Line Items</div>
              {invoice.lineItems.map(item => (
                <div key={item.id} className='grid grid-cols-[1fr,100px,120px,120px] gap-2 items-center py-2 border-t border-slate-800'>
                  <div>{item.description}</div>
                  <div className='text-right'>{item.quantity}</div>
                  <div className='text-right'>${item.unitPrice.toFixed(2)}</div>
                  <div className='text-right'>${(item.quantity * item.unitPrice).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className='grid sm:grid-cols-2 gap-4 mt-4'>
              <div>
                {invoice.notes && (
                  <>
                    <div className='text-slate-400 text-sm'>Notes</div>
                    <p className='text-sm'>{invoice.notes}</p>
                  </>
                )}
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-slate-400'>Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-slate-400'>Discount</span>
                  <span>${invoice.discount.toFixed(2)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-slate-400'>Tax ({invoice.taxRate}%)</span>
                  <span>${((invoice.subtotal - invoice.discount) * (invoice.taxRate / 100)).toFixed(2)}</span>
                </div>
                <div className='flex justify-between font-semibold text-lg pt-2 border-t border-slate-700'>
                  <span>Total</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}


function DocumentsTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await api(`/projects/${projectId}/documents`)
      setDocuments(data)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now()
        const fileName = `${timestamp}-${file.name}`
        const storagePath = `projects/${projectId}/documents/${fileName}`

        const storageRef = ref(storage, storagePath)
        const uploadTask = uploadBytesResumable(storageRef, file)

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              console.error('Upload error:', error)
              reject(error)
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                await api(`/projects/${projectId}/documents`, {
                  method: 'POST',
                  body: JSON.stringify({
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    url: downloadURL,
                    storagePath,
                  }),
                })
                resolve()
              } catch (err) {
                reject(err)
              }
            }
          )
        })
      }

      e.target.value = ''
      await loadDocuments()
      alert('Files uploaded successfully!')
    } catch (err) {
      console.error('Failed to upload files:', err)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"?`)) return

    try {
      await api(`/projects/${projectId}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      await loadDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Failed to delete document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📁'
  }

  useEffect(() => {
    loadDocuments()
  }, [projectId])

  if (loading) return <Card>Loading documents...</Card>

  return (
    <Card>
      <div className='flex justify-between items-center mb-4'>
        <div className='text-xl font-semibold'>Project Documents</div>
        <label className='cursor-pointer px-3 py-1 rounded-lg bg-brand text-white text-sm'>
          <input
            type='file'
            multiple
            onChange={handleFileUpload}
            className='hidden'
            disabled={uploading}
          />
          {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Upload Files'}
        </label>
      </div>

      {documents.length === 0 ? (
        <div className='text-slate-400 text-center py-8'>No documents yet. Upload files to get started!</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {documents.map((doc) => (
            <div key={doc.id} className='border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <span className='text-2xl'>{getFileIcon(doc.type)}</span>
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium truncate' title={doc.name}>
                      {doc.name}
                    </div>
                    <div className='text-xs text-slate-400'>{formatFileSize(doc.size)}</div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDocument(doc)}
                  className='text-red-400 hover:text-red-300 ml-2'
                  title='Delete'
                >
                  ×
                </button>
              </div>
              <div className='flex items-center justify-between pt-2 border-t border-slate-800'>
                <div className='text-xs text-slate-500'>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
                <a
                  href={doc.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-blue-400 hover:text-blue-300'
                >
                  Open →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
