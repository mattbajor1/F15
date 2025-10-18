import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface SettingsData {
  projectStatuses: string[]
  projectTypes: string[]
  taskStatuses: string[]
  equipmentTypes: string[]
  marketingContentTypes: string[]
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    projectStatuses: [],
    projectTypes: [],
    taskStatuses: [],
    equipmentTypes: [],
    marketingContentTypes: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api('/settings')
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      alert('Settings saved successfully!')
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addItem = (category: keyof SettingsData) => {
    if (!newValue.trim()) return
    setSettings({
      ...settings,
      [category]: [...settings[category], newValue.trim()],
    })
    setNewValue('')
    setEditingCategory(null)
  }

  const removeItem = (category: keyof SettingsData, index: number) => {
    setSettings({
      ...settings,
      [category]: settings[category].filter((_, i) => i !== index),
    })
  }

  const updateItem = (category: keyof SettingsData, index: number, value: string) => {
    const updated = [...settings[category]]
    updated[index] = value
    setSettings({
      ...settings,
      [category]: updated,
    })
  }

  if (loading) {
    return <div className='p-6'>Loading settings...</div>
  }

  const categories: { key: keyof SettingsData; label: string; description: string }[] = [
    {
      key: 'projectStatuses',
      label: 'Project Statuses',
      description: 'Available status options for projects',
    },
    {
      key: 'projectTypes',
      label: 'Project Types',
      description: 'Types of projects (e.g., Feature Film, Commercial)',
    },
    {
      key: 'taskStatuses',
      label: 'Task Statuses',
      description: 'Available status options for tasks',
    },
    {
      key: 'equipmentTypes',
      label: 'Equipment Types',
      description: 'Categories for equipment inventory',
    },
    {
      key: 'marketingContentTypes',
      label: 'Marketing Content Types',
      description: 'Types of marketing content that can be generated',
    },
  ]

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Settings</h1>
          <p className='text-slate-400 mt-1'>Manage dropdown options and system configurations</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className='space-y-6'>
        {categories.map((category) => (
          <div key={category.key} className='bg-white rounded-lg shadow p-6'>
            <div className='mb-4'>
              <h2 className='text-xl font-semibold'>{category.label}</h2>
              <p className='text-sm text-gray-600 mt-1'>{category.description}</p>
            </div>

            <div className='space-y-2'>
              {settings[category.key].map((item, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <input
                    value={item}
                    onChange={(e) => updateItem(category.key, index, e.target.value)}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-md'
                  />
                  <button
                    onClick={() => removeItem(category.key, index)}
                    className='px-3 py-2 text-red-600 hover:text-red-800'
                    title='Remove'
                  >
                    ✕
                  </button>
                </div>
              ))}

              {editingCategory === category.key ? (
                <div className='flex items-center gap-2 mt-2'>
                  <input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem(category.key)}
                    placeholder='Enter new option'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-md'
                    autoFocus
                  />
                  <button
                    onClick={() => addItem(category.key)}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null)
                      setNewValue('')
                    }}
                    className='px-3 py-2 text-gray-600 hover:text-gray-800'
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingCategory(category.key)}
                  className='mt-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800'
                >
                  + Add New Option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <h3 className='font-semibold text-yellow-800 mb-2'>⚠️ Important Notes</h3>
        <ul className='text-sm text-yellow-700 space-y-1 list-disc list-inside'>
          <li>Changes will affect all dropdown menus across the application</li>
          <li>Removing an option won't delete existing data using that option</li>
          <li>Make sure to click "Save Changes" to persist your modifications</li>
          <li>All team members will see the updated options immediately after saving</li>
        </ul>
      </div>
    </div>
  )
}
