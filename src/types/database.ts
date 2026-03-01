export type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string
}

export type Category = {
    id: string
    user_id: string
    name: string
    color: string
    icon: string | null
    created_at: string
}

export type Objective = {
    id: string
    user_id: string
    title: string
    description: string | null
    status: 'active' | 'archived'
    created_at: string
}

export type TaskStatus = 'backlog' | 'todo' | 'done'
export type Priority = 'high' | 'medium' | 'low'

export type Task = {
    id: string
    user_id: string
    objective_id: string | null
    category_id: string | null
    title: string
    description: string | null
    status: TaskStatus
    priority: Priority
    due_date: string | null
    estimated_duration: number
    created_at: string
}

export type TaskSchedule = {
    id: string
    user_id: string
    task_id: string
    start_time: string
    duration: number
    created_at: string
}

export type Template = {
    id: string
    user_id: string
    category_id: string | null
    title: string
    day_of_week: number
    start_time: string
    end_time: string
    effective_from: string
    effective_to: string | null
    created_at: string
}

export type OverrideType = 'modify' | 'delete' | 'add'

export type Override = {
    id: string
    user_id: string
    template_id: string | null
    date: string
    type: OverrideType
    title: string | null
    category_id: string | null
    start_time: string | null
    end_time: string | null
    created_at: string
}

export type TimeEntry = {
    id: string
    user_id: string
    task_id: string | null
    category_id: string | null
    start_time: string
    end_time: string | null
    duration: number | null
    created_at: string
}
