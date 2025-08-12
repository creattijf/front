import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material'
import type { Task } from '../types'
import { DatePicker } from '@mui/x-date-pickers'
import { format } from 'date-fns'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; description: string; completed?: boolean; due_date?: string | null }) => void
  initial?: Task | null
  defaultDate?: Date | null
}

export default function TaskDialog({ open, onClose, onSubmit, initial, defaultDate = null }: Props) {
  const isEdit = !!initial
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completed, setCompleted] = useState(false)
  const [date, setDate] = useState<Date | null>(defaultDate)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDescription(initial?.description || '')
      setCompleted(initial?.completed || false)
      setDate(initial?.due_date ? new Date(initial.due_date) : defaultDate)
      setTouched(false)
    }
  }, [open, initial, defaultDate])

  const handleSubmit = () => {
    setTouched(true)
    if (title.trim().length === 0) return
    const due_date = date ? format(date, 'yyyy-MM-dd') : null
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      ...(isEdit ? { completed } : {}),
      due_date,
    })
  }

  const titleError = touched && title.trim().length === 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={titleError}
            helperText={titleError ? 'Введите заголовок' : ' '}
            autoFocus
            fullWidth
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <DatePicker
            label="Дата (для недельного планера)"
            value={date}
            onChange={(d) => setDate(d)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          {isEdit && (
            <FormControlLabel
              control={<Checkbox checked={completed} onChange={(e) => setCompleted(e.target.checked)} />}
              label="Выполнено"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
