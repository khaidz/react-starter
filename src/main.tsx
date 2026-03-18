import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/dropzone/styles.css'
import './index.css'
import App from './App.tsx'
import { GlobalLoading } from '@/components/global-loading'

const inputLabelStyles = {
  // label: { fontSize: '14px' },
}

const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'vibBlue',
  primaryShade: 6,
  colors: {
    vibBlue: [
      '#e5eef6',
      '#ccdded',
      '#99bbdb',
      '#6699c9',
      '#3377b7',
      '#0055a5',
      '#004b8d',
      '#003d75',
      '#002f5c',
      '#002144',
    ],
    vibOrange: [
      '#fef3eb',
      '#fde7d7',
      '#fbcfaf',
      '#f9b787',
      '#f79f5f',
      '#f58737',
      '#f37021',
      '#cc5e1b',
      '#a54c16',
      '#7e3a10',
    ],
  },
  components: {
    TextInput: { styles: inputLabelStyles },
    PasswordInput: { styles: inputLabelStyles },
    NumberInput: { styles: inputLabelStyles },
    Textarea: { styles: inputLabelStyles },
    Select: { styles: inputLabelStyles },
    MultiSelect: { styles: inputLabelStyles },
    DateInput: { styles: inputLabelStyles },
    DatePickerInput: { styles: inputLabelStyles },
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications position="top-right" autoClose={2000} />
          <GlobalLoading />
          <App />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
