import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { FilesPage } from './features/files/FilesPage'
import { PublicSharePage } from './features/public/PublicSharePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SharedLinksPage } from './features/sharing/SharedLinksPage'
import { TrashPage } from './features/trash/TrashPage'
import { AppShellLayout } from './layouts/AppShellLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/share/:token" element={<PublicSharePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShellLayout />}>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/shared-links" element={<SharedLinksPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
