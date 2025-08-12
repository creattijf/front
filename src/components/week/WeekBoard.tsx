import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import TodayIcon from '@mui/icons-material/Today'
import { alpha, useTheme } from '@mui/material/styles'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Task } from '../../types'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTask, createTask } from '../../api/tasksApi'

import TaskCard from '../TaskCard'

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function DayHeader({
  date,
  tasks,
}: {
  date: Date
  tasks: Task[]
}) {
  const isToday =
    format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
      >
        {format(date, 'EEE, d MMM', { locale: ru })}
      </Typography>
      {isToday && (
        <Tooltip title="Сегодня">
          <TodayIcon fontSize="small" />
        </Tooltip>
      )}
      <Box sx={{ ml: 'auto' }}>
        <Typography variant="caption" color="text.secondary">
          {tasks.filter((t) => t.completed).length}/{tasks.length}
        </Typography>
      </Box>
    </Stack>
  )
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ minHeight: 120, width: '100%' }}>
      {children}
    </div>
  )
}

function SortableTask({
  task,
  onEdit,
  onToggleCompleted,
  onDelete,
  onUpdateDescription,
}: {
  task: Task
  onEdit: (t: Task) => void
  onToggleCompleted: (t: Task, next: boolean) => void
  onDelete: (t: Task) => void
  onUpdateDescription?: (t: Task, nextDesc: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id: String(task.id) })

  const style: React.CSSProperties = {
    transform: isDragging
      ? `${CSS.Transform.toString(transform)} scale(1.02)`
      : CSS.Transform.toString(transform),
    transition:
      transition ?? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    width: '100%',
    listStyle: 'none',
    marginBottom: 12,
    zIndex: isDragging ? 10 : isSorting ? 5 : 'auto',
    willChange: 'transform',
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        compact
        hoverLift={false}
        onEdit={onEdit}
        onToggleCompleted={onToggleCompleted}
        onDelete={onDelete}
        onUpdateDescription={onUpdateDescription}
      />
    </div>
  )
}

export default function WeekBoard({
  anchor,
  tasks,
  onCreateInDay,
  onEditTask,
  onToggleCompleted,
  onDeleteTask,
  onUpdateDescription,
}: {
  anchor: Date
  tasks: Task[]
  onCreateInDay?: (date: Date) => void
  onEditTask?: (t: Task) => void
  onToggleCompleted?: (t: Task, next: boolean) => void
  onDeleteTask?: (t: Task) => void
  onUpdateDescription?: (t: Task, nextDesc: string) => void
}) {
  const theme = useTheme()
  const qc = useQueryClient()

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayIds = days.map(dayKey)

  // Группируем задачи по due_date
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = Object.fromEntries(
      dayIds.map((id) => [id, []])
    )
    for (const task of tasks) {
      const due = task.due_date || ''
      if (due && map[due]) {
        map[due].push(task)
      }
    }
    return map
  }, [tasks, dayIds])

  // Локальный порядок внутри колонок
  const [columns, setColumns] = useState<Record<string, number[]>>({})
  useEffect(() => {
    const next: Record<string, number[]> = {}
    for (const id of dayIds) {
      next[id] = (grouped[id] || []).map((t) => t.id)
    }
    setColumns(next)
  }, [grouped, dayIds])

  // Мутация обновления задачи
  const updateMut = useMutation({
    mutationFn: (payload: {
      id: number
      title: string
      description: string
      completed: boolean
      due_date: string | null
    }) => updateTask(payload.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Мутация создания задачи
  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const activeId = Number(active.id)
    const overId = String(over.id)

    const fromCol = Object.keys(columns).find((cid) =>
      (columns[cid] || []).includes(activeId)
    )
    let toCol: string | null = null

    if (dayIds.includes(overId)) {
      toCol = overId
    } else {
      const overTask = tasks.find((x) => String(x.id) === overId)
      toCol = overTask?.due_date || null
    }
    if (!fromCol || !toCol) return

    if (fromCol === toCol) {
      // reorder внутри колонки
      const list = columns[fromCol] || []
      const oldIndex = list.indexOf(activeId)
      const newIndex = list.indexOf(Number(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      const next = [...list]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      setColumns((prev) => ({ ...prev, [fromCol!]: next }))
      return
    }

    // перенос между днями
    qc.setQueryData<Task[]>(['tasks'], (old = []) =>
      old.map((x) => (x.id === activeId ? { ...x, due_date: toCol! } : x))
    )
    setColumns((prev) => {
      const next = { ...prev }
      next[fromCol] = (prev[fromCol] || []).filter((id) => id !== activeId)
      next[toCol!] = [activeId, ...(prev[toCol!] || [])]
      return next
    })

    const task = tasks.find((x) => x.id === activeId)
    if (task) {
      updateMut.mutate({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        due_date: toCol,
      })
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(7, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {days.map((date) => {
          const id = dayKey(date)
          const items =
            (columns[id] || [])
              .map((tid) => tasks.find((t) => t.id === tid)!)
              .filter(Boolean) || []

          return (
            <Paper
              key={id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                backdropFilter: 'saturate(160%) blur(16px)',
                background:
                  theme.palette.mode === 'dark'
                    ? alpha('#0E1324', 0.5)
                    : alpha('#FFFFFF', 0.75),
                border: `1px solid ${alpha(
                  theme.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021',
                  0.12
                )}`,
                position: 'relative',
                overflow: 'visible',
                minHeight: 280,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                  opacity: 0.55,
                },
              }}
            >
              <Stack spacing={1.5}>
                <DayHeader date={date} tasks={grouped[id] || []} />

                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Добавить задачу в этот день">
                    <IconButton
                      size="small"
                      onClick={() =>
                        onCreateInDay
                          ? onCreateInDay(date)
                          : createMut.mutate({
                              title: 'Новая задача',
                              description: '',
                              due_date: id,
                            })
                      }
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <DroppableColumn id={id}>
                  <SortableContext
                    items={(columns[id] || []).map(String)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ opacity: 0.7 }}
                      >
                        Нет задач
                      </Typography>
                    ) : (
                      items.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={onEditTask || (() => {})}
                          onToggleCompleted={onToggleCompleted || (() => {})}
                          onDelete={onDeleteTask || (() => {})}
                          onUpdateDescription={onUpdateDescription}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableColumn>
              </Stack>
            </Paper>
          )
        })}
      </Box>
    </DndContext>
  )
}
