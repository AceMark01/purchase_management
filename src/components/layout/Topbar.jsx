import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Avatar, Badge, Menu, MenuItem,
  Divider, Box, ListItemIcon, Tooltip, Chip, List, ListItem, ListItemText,
  Popover, useTheme, alpha, Stack,
} from '@mui/material';
import MenuIcon           from '@mui/icons-material/Menu';
import NotificationsIcon  from '@mui/icons-material/Notifications';
import LightModeIcon      from '@mui/icons-material/LightMode';
import DarkModeIcon       from '@mui/icons-material/DarkMode';
import LogoutIcon         from '@mui/icons-material/Logout';
import DoneAllIcon        from '@mui/icons-material/DoneAll';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useSelector, useDispatch } from 'react-redux';
import { markAllRead, markRead } from '../../store/slices/notificationSlice';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { DRAWER_WIDTH } from './Sidebar';

const TOPBAR_HEIGHT = 64;

const PAGE_TITLES = {
  '/dashboard':        { label: 'Dashboard',              sub: 'Overview & analytics' },
  '/indent':           { label: 'Indent Management',      sub: 'Manage purchase indents' },
  '/purchase-order':   { label: 'Generate Purchase PO',   sub: 'Create & manage purchase orders' },
  '/approval-po':      { label: 'Approval Purchase PO',   sub: 'Review & approve purchase orders' },
  '/send-po':          { label: 'Send PO To Party',        sub: 'Dispatch purchase orders to vendors' },
  '/follow-up':        { label: 'Follow-Up',              sub: 'Track vendor follow-ups' },
  '/logistics':        { label: 'Arrange Logistics',      sub: 'Manage transport & delivery' },
  '/lifting':          { label: 'Get Lifting',            sub: 'Schedule material lifting' },
  '/receive-material': { label: 'Receive Material',       sub: 'Record material receipts' },
  '/lift-receiver':    { label: 'Lift Receiver Material', sub: 'Manage received material storage' },
  '/tally-entry':      { label: 'Tally Entry',            sub: 'Financial voucher entries' },
  '/settings':         { label: 'Settings',               sub: 'Manage system users & roles' },
  '/reports':          { label: 'Reports & Analytics',    sub: 'Business intelligence' },
  '/master':           { label: 'Company Master',         sub: 'Manage company records' },
  '/product-data':     { label: 'Product Master',         sub: 'Manage product catalog' },
  '/vendors':          { label: 'Vendor Master',          sub: 'Manage vendor records' },
  '/whatsapp':         { label: 'WhatsApp Form',          sub: 'Capture and record incoming WhatsApp orders' },
};

const NOTIF_ICONS = {
  indent:    { color: '#2563eb', bg: 'rgba(37,99,235,.1)' },
  po:        { color: '#7c3aed', bg: 'rgba(124,58,237,.1)' },
  receive:   { color: '#059669', bg: 'rgba(5,150,105,.1)' },
  followup:  { color: '#d97706', bg: 'rgba(217,119,6,.1)' },
  logistics: { color: '#0891b2', bg: 'rgba(8,145,178,.1)' },
};

export default function Topbar({ onMenuClick, sidebarOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = mode === 'dark';

  const notifications = useSelector((s) => s.notifications.items);
  const unread = notifications.filter((n) => !n.read).length;

  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const pageInfo = PAGE_TITLES[location.pathname] || { label: 'Page', sub: '' };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: TOPBAR_HEIGHT,
        width: { md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
        left:  { md: sidebarOpen ? DRAWER_WIDTH : 0 },
        right: 0,
        transition: theme.transitions.create(['width', 'left'], {
          easing: theme.transitions.easing.sharp,
          duration: 200,
        }),
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
        backdropFilter: 'blur(8px)',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${TOPBAR_HEIGHT}px !important`,
          px: { xs: 2, sm: 2.5, md: 3 },
          gap: 1,
        }}
      >


        {/* Hamburger — mobile only */}
        <IconButton
          onClick={onMenuClick}
          edge="start"
          size="small"
          sx={{ display: { md: 'none' }, color: 'text.secondary', mr: 0.5 }}
        >
          <MenuIcon sx={{ fontSize: 22 }} />
        </IconButton>

        {/* Page title */}
        <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: 1 } }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.2 }}>
            {pageInfo.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
            {pageInfo.sub}
          </Typography>
        </Box>

        {/* Right actions */}
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
          {/* Theme toggle */}
          <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{
                width: 36,
                height: 36,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
                position: 'relative',
              }}
            >
              <Badge
                badgeContent={unread}
                color="error"
                max={9}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, top: -2, right: -2 } }}
              >
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Divider */}
          <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 0.5 }} />

          {/* Profile */}
          <Tooltip title="My profile">
            <Box
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
                <Typography variant="caption" fontWeight={600} display="block" noWrap sx={{ lineHeight: 1.2 }}>
                  {user?.name?.split(' ')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem" sx={{ lineHeight: 1 }}>
                  {user?.role?.toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Stack>
      </Toolbar>

      {/* ── Notifications Popover ── */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 440,
            borderRadius: 2,
            mt: 0.5,
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
          },
        }}
        disableScrollLock
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: isDark ? 'rgba(241,245,249,.03)' : 'rgba(15,23,42,.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={700} fontSize="0.9375rem">Notifications</Typography>
            {unread > 0 && (
              <Chip
                label={unread}
                size="small"
                color="error"
                sx={{ height: 20, fontSize: '0.7rem', minWidth: 24, fontWeight: 700 }}
              />
            )}
          </Box>
          {unread > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={() => dispatch(markAllRead())} sx={{ color: 'primary.main' }}>
                <DoneAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* List */}
        <Box sx={{ overflowY: 'auto', maxHeight: 360 }}>
          {notifications.map((n, idx) => {
            const iconStyle = NOTIF_ICONS[n.type] || NOTIF_ICONS.po;
            return (
              <Box
                key={n.id}
                onClick={() => dispatch(markRead(n.id))}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.5,
                  cursor: 'pointer',
                  borderBottom: idx < notifications.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  bgcolor: n.read ? 'transparent' : alpha(theme.palette.primary.main, isDark ? 0.07 : 0.04),
                  transition: 'background 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: n.read ? 'transparent' : 'primary.main',
                    mt: 0.75,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={n.read ? 400 : 600}
                    color={n.read ? 'text.secondary' : 'text.primary'}
                    sx={{ lineHeight: 1.4 }}
                  >
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
                    {n.time}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>

      {/* ── Profile Menu ── */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        PaperProps={{
          sx: { width: 240, borderRadius: 2, mt: 0.5, border: 1, borderColor: 'divider', overflow: 'hidden' },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableScrollLock
      >
        {/* User info */}
        <Box
          sx={{
            px: 2,
            py: 2,
            background: isDark
              ? 'linear-gradient(135deg, rgba(37,99,235,.15) 0%, rgba(124,58,237,.12) 100%)'
              : 'linear-gradient(135deg, rgba(37,99,235,.06) 0%, rgba(124,58,237,.05) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip label={user?.role?.toUpperCase()} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
            <Chip label={user?.department} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Box>
        </Box>

        <Divider />


        <Box sx={{ px: 0.5, py: 0.5 }}>
          <MenuItem
            onClick={() => { logout(); navigate('/login'); }}
            sx={{ borderRadius: 1.5, color: 'error.main' }}
          >
            <ListItemIcon><LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} /></ListItemIcon>
            <Typography variant="body2" color="error.main" fontWeight={600}>Sign Out</Typography>
          </MenuItem>
        </Box>
      </Menu>
    </AppBar>
  );
}
