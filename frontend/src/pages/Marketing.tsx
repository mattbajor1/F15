import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface Project {
  id: string
  name: string
  description: string
  status: string
}

export default function Marketing() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [contentType, setContentType] = useState<string>('social-post')
  const [prompt, setPrompt] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    loadProjects()
    loadHistory()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await api('/projects')
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadHistory = async () => {
    try {
      const data = await api('/marketing/history')
      setHistory(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const generateContent = async () => {
    if (!selectedProject && !prompt) {
      alert('Please select a project or enter a custom prompt')
      return
    }

    setLoading(true)
    setGeneratedContent('')

    try {
      const project = projects.find(p => p.id === selectedProject)
      const body: any = { contentType }

      if (selectedProject && project) {
        body.projectId = selectedProject
        body.projectName = project.name
        body.projectDescription = project.description
      }

      if (prompt) {
        body.customPrompt = prompt
      }

      const data = await api('/marketing/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setGeneratedContent(data.content)
      loadHistory()
    } catch (err) {
      console.error('Failed to generate content:', err)
      alert('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async () => {
    if (!generatedContent || !selectedProject) {
      alert('Please generate content for a project first')
      return
    }

    try {
      await api(`/projects/${selectedProject}/marketing`, {
        method: 'POST',
        body: JSON.stringify({
          type: contentType,
          content: generatedContent,
          createdAt: new Date().toISOString(),
        }),
      })
      alert('Content saved to project!')
      setGeneratedContent('')
      setPrompt('')
    } catch (err) {
      console.error('Failed to save content:', err)
      alert('Failed to save content')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    alert('Content copied to clipboard!')
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI Marketing Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Content</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">None - Custom Content</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="social-post">Social Media Post</option>
                  <option value="email">Email Campaign</option>
                  <option value="blog">Blog Post</option>
                  <option value="ad-copy">Ad Copy</option>
                  <option value="press-release">Press Release</option>
                  <option value="seo-description">SEO Description</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Add specific instructions or details..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                onClick={generateContent}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No history yet</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-md text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setGeneratedContent(item.content)
                      setContentType(item.type)
                    }}
                  >
                    <div className="font-medium text-gray-900">{item.type}</div>
                    <div className="text-gray-600 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Content</h2>
              {generatedContent && (
                <div className="space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Copy
                  </button>
                  {selectedProject && (
                    <button
                      onClick={saveContent}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Save to Project
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : generatedContent ? (
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                  {generatedContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p>Select options and click "Generate Content" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}