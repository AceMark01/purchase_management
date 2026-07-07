import { IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon       from '@mui/icons-material/Edit';
import DeleteIcon     from '@mui/icons-material/Delete';
import PrintIcon      from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';

function ActionBtn({ title, onClick, color = 'default', children }) {
  const theme = useTheme();
  const colorMap = {
    view:    { icon: '#0891b2', bg: 'rgba(8,145,178,.08)'  },
    edit:    { icon: '#2563eb', bg: 'rgba(37,99,235,.08)' },
    delete:  { icon: '#dc2626', bg: 'rgba(220,38,38,.08)' },
    print:   { icon: '#64748b', bg: 'rgba(100,116,139,.08)' },
    default: { icon: '#64748b', bg: 'rgba(100,116,139,.08)' },
  };
  const c = colorMap[color] || colorMap.default;

  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          color: c.icon,
          bgcolor: 'transparent',
          border: 1,
          borderColor: 'transparent',
          transition: 'all 0.15s ease',
          '& svg': { fontSize: 16 },
          '&:hover': {
            bgcolor: c.bg,
            borderColor: alpha(c.icon, 0.2),
            transform: 'scale(1.08)',
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

export function ViewBtn({ onClick })   { return <ActionBtn title="View details" color="view" onClick={onClick}><VisibilityIcon /></ActionBtn>; }
export function EditBtn({ onClick })   { return <ActionBtn title="Edit" color="edit" onClick={onClick}><EditIcon /></ActionBtn>; }
export function DeleteBtn({ onClick }) { return <ActionBtn title="Delete" color="delete" onClick={onClick}><DeleteIcon /></ActionBtn>; }
export function PrintBtn({ onClick })  { return <ActionBtn title="Print" color="print" onClick={onClick}><PrintIcon /></ActionBtn>; }
export function POBtn({ onClick })     { return <ActionBtn title="Generate PO" color="edit" onClick={onClick}><DescriptionIcon /></ActionBtn>; }
