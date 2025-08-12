import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask, getTasks, updateTask } from '../api/tasksAPi'
import {
  Container,
  Stack,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Fab,
  Box,
  Button,
  Grid,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import TaskDialog from '../components/TaskDialog'
import TaskCard from '../components/TaskCard'
import Loader from '../components/Loader'
import type { Task } from '../types'
import { enqueueSnackbar, closeSnackbar } from 'notistack'
import WeekSidebar from '../components/week/WeekSidebar'
import WeekBoard from '../components/week/WeekBoard'
import { startOfWeek, format } from 'date-fns'

// DnD
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useSensors,
  useSensor,
  PointerSensor,
} from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Filter = 'all' | 'active' | 'done'
const dayKey = (d: Date) => format(d, 'yyyy-MM-dd')

// Локальный порядок на scope 
function useScopedOrder(scope: string, baseIds: number[]) {
  const key = `order_${scope}`
  const [orderedIds, setOrderedIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return baseIds
      const saved = JSON.parse(raw) as number[]
      if (!Array.isArray(saved)) return baseIds
      const setBase = new Set(baseIds)
      const cleaned = saved.filter((id) => setBase.has(id))
      const missing = baseIds.filter((id) => !cleaned.includes(id))
      return [...cleaned, ...missing]
    } catch {
      return baseIds
    }
  })

  useEffect(() => {
    const setBase = new Set(baseIds)
    const cleaned = orderedIds.filter((id) => setBase.has(id))
    const missing = baseIds.filter((id) => !cleaned.includes(id))
    const next = [...cleaned, ...missing]
    if (next.length !== orderedIds.length || next.some((v, i) => v !== orderedIds[i])) {
      setOrderedIds(next)
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseIds.join(',')])

  const save = (ids: number[]) => {
    setOrderedIds(ids)
    try { localStorage.setItem(key, JSON.stringify(ids)) } catch {}
  }

  return { orderedIds, setOrderedIds: save }
}

function SortableTaskItem({
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
  onUpdateDescription: (t: Task, nextDesc: string) => void
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

  const translate = CSS.Transform.toString(transform)
  const style: React.CSSProperties = {
    transform: isDragging ? `${translate} scale(1.02)` : translate,
    transition: transition ?? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    listStyle: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 10 : isSorting ? 5 : 'auto',
    willChange: 'transform',
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onToggleCompleted={onToggleCompleted}
        onDelete={onDelete}
        onUpdateDescription={onUpdateDescription}
      />
    </div>
  )
}

export default function TasksPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, isFetching } = useQuery({ queryKey: ['tasks'], queryFn: getTasks })
  const tasks = data || []

  // Режимы
  const [plannerMode, setPlannerMode] = useState(false) // Неделя / Список
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Дневной фильтр
  const [dayFilter, setDayFilter] = useState<string | null>(null) // 'yyyy-MM-dd' | null
  const [dayFilterDate, setDayFilterDate] = useState<Date | null>(null)

  // Диалог
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [defaultDateForDialog, setDefaultDateForDialog] = useState<Date | null>(null)

  // Фильтры списка
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  // Активный элемент для DragOverlay
  const [activeId, setActiveId] = useState<string | null>(null)

  // DnD sensors: drag стартует только после смещения 
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // Мутации
  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      enqueueSnackbar('Задача создана', { variant: 'success' })
    },
    onError: () => enqueueSnackbar('Не удалось создать задачу', { variant: 'error' }),
  })
  const updateMut = useMutation({
    mutationFn: (payload: {
      id: number
      title: string
      description: string
      completed: boolean
      due_date?: string | null
    }) =>
      updateTask(payload.id, {
        title: payload.title,
        description: payload.description,
        completed: payload.completed,
        due_date: payload.due_date ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      enqueueSnackbar('Изменения сохранены', { variant: 'success' })
    },
    onError: () => enqueueSnackbar('Не удалось обновить задачу', { variant: 'error' }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      enqueueSnackbar('Задача удалена', { variant: 'default' })
    },
    onError: () => enqueueSnackbar('Не удалось удалить задачу', { variant: 'error' }),
  })

  // Обработчики карточек
  const onCreate = () => {
    setEditing(null)
    setDefaultDateForDialog(dayFilterDate) // если выбран день — подставим его
    setDialogOpen(true)
  }
  const onEdit = (t: Task) => {
    setEditing(t)
    setDefaultDateForDialog(t.due_date ? new Date(t.due_date) : null)
    setDialogOpen(true)
  }

  // Undo‑удаление 
  const onDelete = (t: Task) => {
    const prev = (qc.getQueryData<Task[]>(['tasks']) || []).slice()
    qc.setQueryData<Task[]>(['tasks'], prev.filter((x) => x.id !== t.id))
    let undone = false
    const key = enqueueSnackbar('Задача удалена', {
      variant: 'default',
      action: (snackbarId) => (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            undone = true
            qc.setQueryData<Task[]>(['tasks'], prev)
            closeSnackbar(snackbarId)
          }}
        >
          Отменить
        </Button>
      ),
      autoHideDuration: 3000,
    })
    // финализируем через 3с, если не отменили
    setTimeout(() => {
      if (!undone) deleteMut.mutate(t.id)
      closeSnackbar(key)
    }, 3000)
  }

  const onToggleCompleted = (t: Task, next: boolean) =>
    updateMut.mutate({
      id: t.id,
      title: t.title,
      description: t.description,
      completed: next,
      due_date: t.due_date ?? null,
    })

  const onUpdateDescription = (t: Task, nextDesc: string) =>
    updateMut.mutate({
      id: t.id,
      title: t.title,
      description: nextDesc,
      completed: t.completed,
      due_date: t.due_date ?? null,
    })

  // Клик по дню в сайдбаре
  const handleSelectDay = (date: Date) => {
    setAnchor(startOfWeek(date, { weekStartsOn: 1 }))
    setPlannerMode(false)
    setDayFilter(dayKey(date))
    setDayFilterDate(date)
  }
  const clearDayFilter = () => {
    setDayFilter(null)
    setDayFilterDate(null)
  }

  const handleDialogSubmit = (payload: {
    title: string
    description: string
    completed?: boolean
    due_date?: string | null
  }) => {
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        title: payload.title,
        description: payload.description,
        completed: payload.completed ?? editing.completed,
        due_date: payload.due_date ?? editing.due_date ?? null,
      })
    } else {
      createMut.mutate({
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date ?? (dayFilterDate ? dayKey(dayFilterDate) : null),
      })
    }
    setDialogOpen(false)
    setDefaultDateForDialog(null)
  }

  // Ошибки
  const errorMessage = useMemo(() => {
    const e = (error as any)?.message
    if (isError) return e || 'Не удалось загрузить задачи'
    if (createMut.isError) return (createMut.error as any)?.message || 'Не удалось создать задачу'
    if (updateMut.isError) return (updateMut.error as any)?.message || 'Не удалось обновить задачу'
    if (deleteMut.isError) return (deleteMut.error as any)?.message || 'Не удалось удалить задачу'
    return null
  }, [isError, error, createMut.isError, createMut.error, updateMut.isError, updateMut.error, deleteMut.isError, deleteMut.error])

  // Фильтрация списка
  const baseList = useMemo(() => {
    let arr = dayFilter ? tasks.filter((t) => t.due_date === dayFilter) : tasks
    if (!dayFilter) {
      if (filter === 'active') arr = arr.filter((t) => !t.completed)
      if (filter === 'done') arr = arr.filter((t) => t.completed)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      )
    }
    return arr
  }, [tasks, dayFilter, filter, search])

  const loading = isLoading || createMut.isPending || updateMut.isPending || deleteMut.isPending

  // DnD порядок для списка (persist в localStorage для all/day-*)
  const scope = dayFilter ? `day-${dayFilter}` : 'all'
  const { orderedIds, setOrderedIds } = useScopedOrder(scope, baseList.map((t) => t.id))
  const tasksById = useMemo(() => {
    const map = new Map<number, Task>()
    for (const t of baseList) map.set(t.id, t)
    return map
  }, [baseList])
  const orderedTasks = orderedIds.map((id) => tasksById.get(id)).filter(Boolean) as Task[]

  // DnD handlers (DragOverlay, плавное drop)
  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const activeIdNum = Number(active.id)
    const overIdNum = Number(over.id)
    if (activeIdNum === overIdNum) return
    const oldIndex = orderedIds.indexOf(activeIdNum)
    const newIndex = orderedIds.indexOf(overIdNum)
    if (oldIndex === -1 || newIndex === -1) return
    const next = [...orderedIds]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    setOrderedIds(next)
  }
  const dropAnimation = {
    duration: 250,
    easing: 'cubic-bezier(.2,.0,.2,1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.85' } },
    }),
  } as const

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Верхняя панель */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {dayFilterDate ? `Задачи на ${format(dayFilterDate, 'EEE, d MMM')}` : plannerMode ? 'План на неделю' : 'Мои задачи'}
          </Typography>

          {dayFilter && (
            <Button size="small" variant="outlined" onClick={clearDayFilter} sx={{ borderWidth: 2 }}>
              Весь список задач
            </Button>
          )}
        </Stack>

        {/* Панель фильтров */}
        {!plannerMode && !dayFilter && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && setFilter(v)}>
              <ToggleButton value="all">Все</ToggleButton>
              <ToggleButton value="active">Активные</ToggleButton>
              <ToggleButton value="done">Выполненные</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              size="small"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
            />
            <Button variant="contained" onClick={onCreate}>Новая задача</Button>
          </Stack>
        )}
      </Stack>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      <Grid container spacing={3} alignItems="start">
        {/* Сайдбар недели  */}
        <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <WeekSidebar
            anchor={anchor}
            tasks={tasks}
            onPrevWeek={() => setAnchor((d) => new Date(d.getTime() - 7 * 24 * 3600 * 1000))}
            onNextWeek={() => setAnchor((d) => new Date(d.getTime() + 7 * 24 * 3600 * 1000))}
            onThisWeek={() => setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            onQuickAdd={(date) => { setEditing(null); setDefaultDateForDialog(date); setDialogOpen(true) }}
            onSelectDay={(date) => { setAnchor(startOfWeek(date, { weekStartsOn: 1 })); setPlannerMode(false); setDayFilter(dayKey(date)); setDayFilterDate(date) }}
            plannerMode={plannerMode}
            onToggleMode={setPlannerMode}
          />
        </Grid>

        {/* Контент */}
        <Grid item xs={12} md={9}>
          {loading && isLoading ? (
            <Loader />
          ) : plannerMode && !dayFilter ? (
            <WeekBoard anchor={anchor} tasks={tasks} />
          ) : orderedTasks.length === 0 && !isFetching ? (
            <Typography color="text.secondary">Нет задач{dayFilterDate ? ' на выбранный день' : ''}.</Typography>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
              <SortableContext items={orderedIds.map(String)} strategy={rectSortingStrategy}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {orderedTasks.map((t) => (
                    <SortableTaskItem key={t.id} task={t} onEdit={onEdit} onToggleCompleted={onToggleCompleted} onDelete={onDelete} onUpdateDescription={onUpdateDescription} />
                  ))}
                </Box>
              </SortableContext>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                  <Box sx={{ transform: 'scale(1.02)', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,.25))', pointerEvents: 'none' }}>
                    {(() => {
                      const t = tasksById.get(Number(activeId))
                      return t ? <TaskCard task={t} onEdit={onEdit} onToggleCompleted={onToggleCompleted} onDelete={onDelete} onUpdateDescription={onUpdateDescription} /> : null
                    })()}
                  </Box>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </Grid>
      </Grid>

      {!plannerMode && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={onCreate}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 32 },
            right: { xs: 24, md: 32 },
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
            boxShadow: '0 12px 28px rgba(124,58,237,.35)',
            '&:hover': { filter: 'brightness(1.08)', boxShadow: '0 16px 32px rgba(124,58,237,.45)' },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setDefaultDateForDialog(null) }}
        onSubmit={handleDialogSubmit}
        initial={editing}
        defaultDate={defaultDateForDialog}
      />
    </Container>
  )
}