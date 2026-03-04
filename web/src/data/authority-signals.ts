export interface AffiliationItem {
  id: string
  institution: string
  badgeText: string
  role: string
  period?: string
  url?: string
}

export interface MediaMentionItem {
  id: string
  name: string
  url: string
}

export const affiliations: AffiliationItem[] = [
  {
    id: 'uconn',
    institution: 'University of Connecticut',
    badgeText: 'UConn',
    role: 'Applied GenAI Instructor and Mentor',
    period: 'Current',
    url: 'https://www.uconn.edu/'
  }
]

export const mediaMentions: MediaMentionItem[] = []
