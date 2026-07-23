import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Typography, Avatar, Divider, Chip, alpha, useTheme,
} from '@mui/material';
import DashboardIcon        from '@mui/icons-material/Dashboard';
import DescriptionIcon      from '@mui/icons-material/Description';
import ShoppingCartIcon     from '@mui/icons-material/ShoppingCart';
import PhoneCallbackIcon    from '@mui/icons-material/PhoneCallback';
import LocalShippingIcon    from '@mui/icons-material/LocalShipping';
import ForkliftIcon         from '@mui/icons-material/Forklift';
import InventoryIcon        from '@mui/icons-material/Inventory';
import MoveToInboxIcon      from '@mui/icons-material/MoveToInbox';
import CalculateIcon        from '@mui/icons-material/Calculate';
import CancelIcon           from '@mui/icons-material/Cancel';
import SettingsIcon         from '@mui/icons-material/Settings';
import AssessmentIcon       from '@mui/icons-material/Assessment';
import ExpandLessIcon       from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon       from '@mui/icons-material/ExpandMore';
import BusinessCenterIcon   from '@mui/icons-material/BusinessCenter';
import LogoutIcon           from '@mui/icons-material/Logout';
import ApartmentIcon        from '@mui/icons-material/Apartment';
import HandshakeIcon        from '@mui/icons-material/Handshake';
import FactCheckIcon        from '@mui/icons-material/FactCheck';
import SendIcon             from '@mui/icons-material/Send';
import VerifiedIcon         from '@mui/icons-material/Verified';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { groupByPO } from '../../utils/poGroupUtils';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

export const DRAWER_WIDTH = 264;

const NAV_SECTIONS = [
  {
    key: 'main',
    items: [
      { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard', page: 'dashboard' },
      { label: 'WhatsApp Form', icon: WhatsAppIcon, path: '/whatsapp', page: 'whatsapp' },
    ],
  },
  {
    key: 'purchase',
    label: 'Purchase Process',
    items: [
      { label: 'Indent Management',              icon: DescriptionIcon,   path: '/indent',           page: 'indent' },
      { label: 'Generate Purchase PO',           icon: ShoppingCartIcon,  path: '/purchase-order',   page: 'purchaseOrder' },
      { label: 'Approval Purchase PO',           icon: FactCheckIcon,     path: '/approval-po',      page: 'approvalPO' },
      { label: 'Send PO To Party',               icon: SendIcon,          path: '/send-po',          page: 'sendPO' },
      { label: 'Follow-Up',                      icon: PhoneCallbackIcon, path: '/follow-up',        page: 'followUp' },
      { label: 'Arrange Logistics & Get Lifting',icon: LocalShippingIcon, path: '/logistics',        page: 'logistics' },
      { label: 'Receive Material',               icon: InventoryIcon,     path: '/receive-material', page: 'receiveMaterial' },
      { label: 'Lift Receiver Material',         icon: MoveToInboxIcon,   path: '/lift-receiver',    page: 'liftReceiver' },
      { label: 'Tally Entry',                    icon: CalculateIcon,     path: '/tally-entry',      page: 'tallyEntry' },
      { label: 'Order Cancel',                   icon: CancelIcon,        path: '/order-cancel',     page: 'orderCancel' },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    items: [
      { label: 'Company Master',         icon: ApartmentIcon,  path: '/master',   page: 'master' },
      { label: 'Product Data',           icon: BusinessCenterIcon, path: '/product-data', page: 'productData' },
      { label: 'Vendor',                 icon: HandshakeIcon,  path: '/vendors',  page: 'vendors' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    items: [
      { label: 'Settings',        icon: SettingsIcon, path: '/settings', page: 'settings' },
    ],
  },
];

function NavSection({ section }) {
  const { hasAccess } = useAuth();
  const { records = [], pendingPoRecords = [] } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [isOpen, setIsOpen] = useState(true);

  const getPendingCount = (page) => {
    if (!records || records.length === 0) return 0;

    switch (page) {
      case 'purchaseOrder':
        return pendingPoRecords.length;
      case 'approvalPO':
        return groupByPO(records.filter(r => r.workflowStage?.approvalPO === 'Pending')).length;
      case 'sendPO':
        return groupByPO(records.filter(r => r.workflowStage?.sendPO === 'Pending')).length;
      case 'followUp':
        return groupByPO(records.filter(r => r.workflowStage?.followUp === 'Pending')).length;
      case 'logistics':
        return groupByPO(records.filter(r => r.workflowStage?.logistics === 'Pending')).length;
      case 'receiveMaterial':
        return groupByPO(records.filter(r => r.workflowStage?.receiveMaterial === 'Pending')).length;
      case 'liftReceiver':
        return groupByPO(
          records.filter(
            r =>
              r.liftPlanned &&
              String(r.liftPlanned).trim() !== '' &&
              (!r.liftActual || String(r.liftActual).trim() === '')
          )
        ).length;
      case 'tallyEntry':
        return groupByPO(
          records.filter(
            r =>
              r.tallyPlanned &&
              String(r.tallyPlanned).trim() !== '' &&
              (!r.tallyActual || String(r.tallyActual).trim() === '')
          )
        ).length;
      default:
        return 0;
    }
  };

  const accessible = section.items.filter((i) => !i.page || hasAccess(i.page));
  if (accessible.length === 0) return null;

  return (
    <Box sx={{ mb: 0.5 }}>
      {section.label && (
        <ListItemButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            py: 1.5,
            px: 2.5,
            minHeight: 36,
            '&:hover': { bgcolor: 'transparent' },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.disabled',
            }}
          >
            {section.label}
          </Typography>
          {isOpen ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
        </ListItemButton>
      )}
      <Collapse in={!section.label || isOpen} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ px: 1.5 }}>
          {accessible.map((item) => {
            const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const count = getPendingCount(item.page);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                py: '8px',
                px: '10px',
                minHeight: 40,
                position: 'relative',
                gap: 0,
                transition: 'all 0.15s ease',
                bgcolor: isActive
                  ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1)
                  : 'transparent',
                '&:hover': {
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, isDark ? 0.24 : 0.13)
                    : theme.palette.action.hover,
                },
                '&::before': isActive ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: '60%',
                  bgcolor: 'primary.main',
                  borderRadius: '0 4px 4px 0',
                } : {},
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 1.25,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.15s ease',
                  '& svg': { fontSize: 19 },
                }}
              >
                <item.icon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    fontWeight={isActive ? 600 : 400}
                    color={isActive ? 'primary.main' : 'text.primary'}
                    sx={{ transition: 'all 0.15s ease', fontSize: '0.875rem' }}
                  >
                    {item.label}
                  </Typography>
                }
              />
              {count > 0 && (
                <Box
                  sx={{
                    ml: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    borderRadius: '10px',
                    px: 0.75,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff',
                    bgcolor: 'error.main',
                    boxShadow: `0 2px 4px ${alpha(theme.palette.error.main, 0.35)}`,
                    flexShrink: 0,
                  }}
                >
                  {count}
                </Box>
              )}
            </ListItemButton>
          );
        })}
        </List>
      </Collapse>
    </Box>
  );
}

export default function Sidebar({ open, onClose, variant }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* ── Logo ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          height: 64,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: 40,
            height: 40,
          }}
        >
          <img src="/ace-logo.png" alt="ACE Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ lineHeight: 1.1 }}>
            Acemark
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Purchase Management
          </Typography>
        </Box>
      </Box>

      {/* Profile block moved to bottom */}

      {/* ── Nav ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <NavSection key={section.key} section={section} />
        ))}
      </Box>

      {/* ── User Profile ── */}
      <Box sx={{ px: 1.5, py: 1.25, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.25,
            py: 1,
            borderRadius: 1.5,
            bgcolor: isDark ? 'rgba(241,245,249,.05)' : 'rgba(15,23,42,.03)',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: '0.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              flexShrink: 0,
            }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.2 }}>
              {user?.name || 'Guest User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.department}
            </Typography>
          </Box>
          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            color={user?.role === 'admin' ? 'primary' : 'default'}
            sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}
          />
        </Box>
      </Box>

      {/* ── Logout ── */}
      <Box sx={{ px: 1.5, py: 1, flexShrink: 0 }}>
        <ListItemButton
          onClick={() => { logout(); navigate('/login'); }}
          sx={{
            borderRadius: 1.5,
            py: '8px',
            px: '10px',
            minHeight: 40,
            color: 'error.main',
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: 'error.main', '& svg': { fontSize: 19 } }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" fontWeight={600} color="error.main">Logout</Typography>}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: variant === 'temporary' ? 4 : 'none',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
