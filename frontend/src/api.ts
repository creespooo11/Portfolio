export interface Project {
  id: number
  name: string
  description: string
  repositoryUrl: string
  liveUrl: string | null
  imageUrl: string | null
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

export interface ContactPayload {
  name: string
  email: string
  message: string
}

export interface ValidationDetail {
  field: string
  message: string
}

/** Thrown when contact-service rejects a submission with 400 and field-level details. */
export class ContactValidationError extends Error {
  details: ValidationDetail[]

  constructor(details: ValidationDetail[]) {
    super('Validation failed')
    this.name = 'ContactValidationError'
    this.details = details
  }
}

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

async function submitContact(payload: ContactPayload): Promise<void> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  // contact-service replies 202 Accepted: the event was published, not yet processed.
  if (response.status === 202) return

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as { details?: ValidationDetail[] } | null
    throw new ContactValidationError(body?.details ?? [])
  }

  throw new Error(`API request failed: ${response.status}`)
}

export const portfolioApi = {
  projects: () => get<Project[]>('/api/projects'),
  skills: () => get<Skill[]>('/api/skills'),
  experience: () => get<Experience[]>('/api/experience'),
}

export const contactApi = {
  submit: submitContact,
}
