import { createBrowserRouter } from 'react-router';

import { GuestOnly, RequireAuth } from './auth/guards';
import { AppLayout } from './layout/AppLayout';
import { AuthLayout } from './layout/AuthLayout';
import { SharedLayout } from './layout/SharedLayout';
import { CollectionPage } from './pages/CollectionPage';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { DeckComparePage } from './pages/DeckComparePage';
import { DeckPage } from './pages/DeckPage';
import { DecksPage } from './pages/DecksPage';
import { ExplorePage } from './pages/ExplorePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { SharedDeckRedirect } from './pages/SharedDeckPage';
import { StoragePage } from './pages/StoragePage';
import { StoragesPage } from './pages/StoragesPage';

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/cards', element: <CollectionPage /> },
          { path: '/storages', element: <StoragesPage /> },
          { path: '/storages/:id', element: <StoragePage /> },
          { path: '/decks', element: <DecksPage /> },
          { path: '/explorer', element: <ExplorePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/users/:id', element: <ProfilePage /> },
          { path: '/users/:id/connexions', element: <ConnectionsPage /> },
        ],
      },
    ],
  },
  {
    element: <SharedLayout />,
    children: [
      { path: '/decks/:id', element: <DeckPage /> },
      { path: '/decks/:id/comparer/:otherId', element: <DeckComparePage /> },
      { path: '/shared/:id', element: <SharedDeckRedirect /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
