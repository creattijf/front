import {
  Card, CardContent, CardActions, Typography, IconButton, Checkbox, Stack, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Box, LinearProgress,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import type { Task } from '../types'
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { celebrateAt } from '../lib/confetti'

type Props = {
  task: Task
  onEdit: (task: Task) => void
  onToggleCompleted: (task: Task, next: boolean) => void
  onDelete: (task: Task) => void
  onUpdateDescription?: (task: Task, nextDesc: string) => void
  compact?: boolean
  hoverLift?: boolean
}

type ChecklistItem = { text: string; done: boolean; lineIndex: number }

// Регулярные выражения для чек-листа
const CHECK_RE = new RegExp('^-\\s\\[( |x|X)\\]\\s(.*)$')
const HEAD_RE = new RegExp('^-\\s\\[( |x|X)\\]')

function parseChecklist(description: string) {
  const lines = (description || '').split('\n')
  const items: ChecklistItem[] = []
  lines.forEach((line, idx) => {
    const m = line.match(CHECK_RE)
    if (m) {
      const done = (m[1] || '').toLowerCase() === 'x'
      const text = m[2] || ''
      items.push({ text, done, lineIndex: idx })
    }
  })
  return { lines, items }
}

function toggleChecklistAt(description: string, items: ChecklistItem[], idx: number) {
  const { lines } = parseChecklist(description)
  const item = items[idx]
  if (!item) return description
  const oldLine = lines[item.lineIndex]
  const newHead = item.done ? '- [ ]' : '- [x]'
  const newLine = oldLine.replace(HEAD_RE, newHead)
  lines[item.lineIndex] = newLine
  return lines.join('\n')
}

export default function TaskCard({
  task,
  onEdit,
  onToggleCompleted,
  onDelete,
  onUpdateDescription,
  compact,
  hoverLift,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [flash, setFlash] = useState(false)
  const checkboxAnchorRef = useRef<HTMLDivElement>(null)

  const isCompact = compact ?? false
  const lift = hoverLift ?? true

  const triggerFlash = () => { setFlash(true); setTimeout(() => setFlash(false), 450) }

  // отключаем dnd на интерактивных элементах
  const stopDnd = (e: SyntheticEvent) => { e.stopPropagation() }

  // чек‑лист
  const { items: checklistItems } = useMemo(() => parseChecklist(task.description || ''), [task.description])
  const total = checklistItems.length
  const done = checklistItems.filter((i) => i.done).length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
        whileHover={lift ? { y: -2 } : undefined}
        style={{ position: 'relative' }}
      >
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.35, scale: 0.96 }}
              animate={{ opacity: 0, scale: 1.12 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28, duration: 0.45 }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: 20,
                border: '2px solid rgba(34,197,94,0.6)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}
        </AnimatePresence>

        <Card
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            position: 'relative',
          }}
        >
          <CardContent sx={{ pt: isCompact ? 1 : 2, pb: isCompact ? 1 : 1.5 }}>
            <Stack direction="row" alignItems="start" spacing={1.5}>
              {/* чекбокс задачи */}
              <motion.div whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 700, damping: 18 }}>
                <Box
                  ref={checkboxAnchorRef}
                  sx={{ display: 'inline-flex', position: 'relative' }}
                  onPointerDownCapture={stopDnd}
                  onMouseDownCapture={stopDnd}
                  onTouchStartCapture={stopDnd}
                >
                  <Checkbox
                    checked={task.completed}
                    onChange={(_, checked) => {
                      onToggleCompleted(task, checked)
                      if (checked && checkboxAnchorRef.current) {
                        celebrateAt(checkboxAnchorRef.current, { scale: 1.1 })
                      }
                      // визуальный flash
                      triggerFlash()
                    }}
                    icon={<RadioButtonUncheckedRoundedIcon />}
                    checkedIcon={<CheckCircleRoundedIcon color="success" />}
                    sx={{ mt: -0.5 }}
                  />
                </Box>
              </motion.div>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <motion.div animate={{ scale: task.completed ? 0.98 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      opacity: task.completed ? 0.7 : 1,
                      wordBreak: 'break-word',
                      fontSize: isCompact ? 16 : undefined,
                    }}
                  >
                    {task.title}
                  </Typography>
                </motion.div>

                {/* описание (в неделе — line-clamp) */}
                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'pre-line',
                      mt: 0.5,
                      ...(isCompact && {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }),
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                {/* мини‑прогресс чек‑листа */}
                {total > 0 && (
                  <Stack spacing={1.2} sx={{ mt: 1.25 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 999,
                          '& .MuiLinearProgress-bar': { borderRadius: 999 },
                        }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right', opacity: 0.75 }}>
                        {done}/{total}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.5}>
                      {checklistItems.map((it, idx) => (
                        <Stack key={`${it.lineIndex}-${idx}`} direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                          <Box
                            onPointerDownCapture={stopDnd}
                            onMouseDownCapture={stopDnd}
                            onTouchStartCapture={stopDnd}
                            sx={{ display: 'inline-flex' }}
                          >
                            <Checkbox
                              size="small"
                              checked={it.done}
                              onChange={() => {
                                const next = toggleChecklistAt(task.description || '', checklistItems, idx)
                                onUpdateDescription?.(task, next)
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              opacity: it.done ? 0.7 : 1,
                              textDecoration: it.done ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                            }}
                          >
                            {it.text}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {task.completed ? (
                    <Chip size="small" color="success" variant="outlined" label="Выполнено" />
                  ) : (
                    <Chip size="small" color="primary" variant="outlined" label="В работе" />
                  )}
                  {task.updated_at && (
                    <Chip size="small" variant="outlined" label={new Date(task.updated_at).toLocaleString()} />
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>

          <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={() => onEdit(task)}
                onPointerDownCapture={stopDnd}
                onMouseDownCapture={stopDnd}
                onTouchStartCapture={stopDnd}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton
                color="error"
                size="small"
                onClick={() => setConfirmOpen(true)}
                onPointerDownCapture={stopDnd}
                onMouseDownCapture={stopDnd}
                onTouchStartCapture={stopDnd}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>
      </motion.div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Удалить задачу?</DialogTitle>
        <DialogContent>Это действие необратимо.</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            onPointerDownCapture={stopDnd}
            onMouseDownCapture={stopDnd}
            onTouchStartCapture={stopDnd}
          >
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmOpen(false)
              onDelete(task)
            }}
            onPointerDownCapture={stopDnd}
            onMouseDownCapture={stopDnd}
            onTouchStartCapture={stopDnd}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
