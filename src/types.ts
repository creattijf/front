export type Tokens = {
  access: string
  refresh: string
}

export type Task = {
  id: number
  title: string
  description: string
  completed: boolean
  due_date?: string | null  
  created_at?: string
  updated_at?: string
}