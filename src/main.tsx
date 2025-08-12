import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/outfit'
import App from './App'
import { AuthProvider } from './providers/AuthProvider'
import { ColorModeProvider } from './providers/ColorModeProvider'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import ru from 'date-fns/locale/ru'
import { NotificationsProvider } from './providers/NotificationsProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <ColorModeProvider>
          <SnackbarProvider
            maxSnack={3}
            autoHideDuration={2500}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <NotificationsProvider>
              <BrowserRouter>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </BrowserRouter>
            </NotificationsProvider>
          </SnackbarProvider>
        </ColorModeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
