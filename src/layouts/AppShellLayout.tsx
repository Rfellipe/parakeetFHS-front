import { AppShell, Burger, Button, Group, NavLink, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

const navItems = [
  { to: '/files', label: 'Files' },
  { to: '/shared-links', label: 'Shared Links' },
  { to: '/trash', label: 'Trash' },
  { to: '/settings', label: 'Settings' },
]

export function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>File Hosting System</Text>
          </Group>
          <Group>
            <Text c="dimmed" size="sm">
              {user?.email}
            </Text>
            <Button variant="light" onClick={() => void logout()}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              active={pathname.startsWith(item.to)}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
