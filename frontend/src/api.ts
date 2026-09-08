export interface Project {
  id: number
  name: string
  description: string
  repositoryUrl: string
  liveUrl: string | null
  displayOrder: number
  featured: boolean
}

export interface Skill {
  id: number
  name: string
  category: string
  displayOrder: number
}

export interface Experience {
  id: number
  role: string
  company: string
  summary: string
  period: string
  displayOrder: number
}

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

export const portfolioApi = {
  projects: () => get<Project[]>('/api/projects'),
  skills: () => get<Skill[]>('/api/skills'),
  experience: () => get<Experience[]>('/api/experience'),
}
