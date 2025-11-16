import React, { useState, useRef, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Quiz,
  Dashboard,
  Person,
  Settings,
  Logout,
  Notifications,
  School,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import QuizKnowLogo from '../common/QuizKnowLogo';

const Header = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      drawerRef.current.focus();
    } else if (!mobileOpen && toggleRef.current) {
      toggleRef.current.focus();
    }
  }, [mobileOpen]);

  const handleMenu = () => {
    setAnchorEl(anchorRef.current);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Quizzes', icon: <Quiz />, path: '/quizzes' },
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  ];

  const teacherMenuItems = [
    { text: 'Create Quiz', icon: <Quiz />, path: '/quiz-creator' },
    { text: 'My Quizzes', icon: <School />, path: '/my-quizzes' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          QuizKnow
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            button
            key={item.text}
            ref={index === 0 ? drawerRef : null}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      {user?.role === 'teacher' && (
        <>
          <Divider />
          <List>
            {teacherMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            ref={toggleRef}
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
            <QuizKnowLogo variant="text-only" />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ color: location.pathname === '/' ? 'secondary.main' : 'inherit' }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/quizzes')}
              sx={{ color: location.pathname === '/quizzes' ? 'secondary.main' : 'inherit' }}
            >
              Quizzes
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{ color: location.pathname === '/dashboard' ? 'secondary.main' : 'inherit' }}
            >
              Dashboard
            </Button>

            {user?.role === 'teacher' && (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/quiz-creator')}
                  sx={{ color: location.pathname === '/quiz-creator' ? 'secondary.main' : 'inherit' }}
                >
                  Create Quiz
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/my-quizzes')}
                  sx={{ color: location.pathname === '/my-quizzes' ? 'secondary.main' : 'inherit' }}
                >
                  My Quizzes
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={0} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>

            {user ? (
              <>
                <IconButton
                  ref={anchorRef}
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={onLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button color="inherit" variant="outlined" onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
