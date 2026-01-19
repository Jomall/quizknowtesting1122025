import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  VideoLibrary as VideoLibraryIcon,
  Description as DescriptionIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
// Using native HTML date input instead of MUI date picker for compatibility
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Default timetable template based on the provided model
const DEFAULT_TIMETABLE_SLOTS = [
  {
    startTime: '06:30',
    endTime: '07:30',
    activity: 'Prime Focus - Difficult Subject',
    phase: 'Prime Focus',
    purpose: 'Use peak cognitive alertness for complex concepts.',
    pomodoroEnabled: true,
    pomodoroDuration: 50,
  },
  {
    startTime: '07:30',
    endTime: '08:30',
    activity: 'Recharge - Healthy Breakfast & Light Exercise',
    phase: 'Recharge',
    purpose: 'Fuel the body and mind.',
    pomodoroEnabled: false,
  },
  {
    startTime: '08:30',
    endTime: '13:00',
    activity: 'Class/Deep Work - Core Lessons',
    phase: 'Active Practice',
    purpose: 'Focus on new material or intensive problem-solving.',
    pomodoroEnabled: true,
    pomodoroDuration: 25,
  },
  {
    startTime: '13:00',
    endTime: '14:00',
    activity: 'Rest - Lunch & Power Nap',
    phase: 'Rest',
    purpose: 'Prevent afternoon mental fatigue.',
    pomodoroEnabled: false,
  },
  {
    startTime: '14:00',
    endTime: '16:00',
    activity: 'Active Practice - Homework',
    phase: 'Active Practice',
    purpose: 'Switch to creative or writing-heavy tasks.',
    pomodoroEnabled: true,
    pomodoroDuration: 25,
  },
  {
    startTime: '16:30',
    endTime: '18:00',
    activity: 'Revision - Review Day\'s Notes',
    phase: 'Revision',
    purpose: 'Use Active Recall to consolidate new info.',
    pomodoroEnabled: true,
    pomodoroDuration: 25,
  },
  {
    startTime: '18:00',
    endTime: '20:00',
    activity: 'Balance - Hobbies & Dinner',
    phase: 'Balance',
    purpose: 'Essential for mental well-being and avoiding burnout.',
    pomodoroEnabled: false,
  },
  {
    startTime: '20:30',
    endTime: '21:30',
    activity: 'Light Prep - Flashcards',
    phase: 'Light Prep',
    purpose: 'Low-energy tasks that strengthen long-term memory.',
    pomodoroEnabled: true,
    pomodoroDuration: 25,
    spacedRepetition: true,
    repetitionInterval: 1,
  },
];

const Timetable = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTimetable, setCurrentTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    startTime: '',
    endTime: '',
    activity: '',
    phase: 'Prime Focus',
    purpose: '',
    pomodoroEnabled: false,
    pomodoroDuration: 25,
    spacedRepetition: false,
    repetitionInterval: 1,
    notes: '',
  });
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0);
  const [pomodoroBreak, setPomodoroBreak] = useState(false);

  const { user } = useAuth();

  // Fetch timetables
  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/timetables`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate.toISOString().split('T')[0] }
      });
      const todayTimetable = response.data.find(t => new Date(t.date).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]);
      setCurrentTimetable(todayTimetable || null);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // Create default timetable
  const createDefaultTimetable = async () => {
    console.log('createDefaultTimetable called');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      const timetableData = {
        date: selectedDate.toISOString().split('T')[0],
        title: 'Daily Study Schedule',
        energyPattern: user?.energyPatterns?.preference || 'balanced',
        peakEnergyTime: user?.energyPatterns?.peakEnergyTime || '08:00',
        timeSlots: DEFAULT_TIMETABLE_SLOTS,
        isTemplate: false
      };
      console.log('Timetable data:', timetableData);

      const response = await axios.post(`${API_BASE_URL}/timetables`, timetableData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response:', response);

      setCurrentTimetable(response.data);
      fetchTimetables();
    } catch (error) {
      console.error('Error creating timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update time slot completion
  const toggleSlotCompletion = async (slotIndex) => {
    if (!currentTimetable) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/timetables/${currentTimetable._id}/slots/${slotIndex}`,
        { completed: !currentTimetable.timeSlots[slotIndex].completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchTimetables();
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };

  // Start Pomodoro timer
  const startPomodoro = (duration, isBreak = false) => {
    setPomodoroActive(true);
    setPomodoroTimeLeft(duration * 60); // Convert to seconds
    setPomodoroBreak(isBreak);
  };

  // Pomodoro timer effect
  useEffect(() => {
    let interval = null;
    if (pomodoroActive && pomodoroTimeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimeLeft(time => time - 1);
      }, 1000);
    } else if (pomodoroActive && pomodoroTimeLeft === 0) {
      setPomodoroActive(false);
      // Play notification sound or show alert
      alert(pomodoroBreak ? 'Break time is over! Time to focus.' : 'Pomodoro session complete! Take a break.');
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTimeLeft, pomodoroBreak]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase color
  const getPhaseColor = (phase) => {
    const colors = {
      'Prime Focus': 'error',
      'Recharge': 'success',
      'Rest': 'info',
      'Active Practice': 'warning',
      'Revision': 'secondary',
      'Balance': 'primary',
      'Light Prep': 'default'
    };
    return colors[phase] || 'default';
  };

  // Get content icon
  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <VideoLibraryIcon />;
      case 'document': return <DescriptionIcon />;
      default: return <SchoolIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Study Timetable
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Select Date"
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          {!currentTimetable && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createDefaultTimetable}
              disabled={loading}
            >
              Create Timetable
            </Button>
          )}
        </Box>
      </Box>

        {/* Pomodoro Timer */}
        {pomodoroActive && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: pomodoroBreak ? 'success.light' : 'error.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimerIcon />
              <Typography variant="h6">
                {pomodoroBreak ? 'Break Time' : 'Focus Time'}: {formatTime(pomodoroTimeLeft)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPomodoroActive(false)}
              >
                Stop
              </Button>
            </Box>
          </Paper>
        )}

        {loading ? (
          <LinearProgress />
        ) : currentTimetable ? (
          <Grid container spacing={3}>
            {/* Timetable Overview */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {currentTimetable.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Energy Pattern: {currentTimetable.energyPattern}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Peak Energy: {currentTimetable.peakEnergyTime}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Progress: {currentTimetable.completionPercentage || 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={currentTimetable.completionPercentage || 0}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Time Slots */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Today's Schedule
                </Typography>
                <List>
                  {currentTimetable.timeSlots.map((slot, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          bgcolor: slot.completed ? 'success.light' : 'background.paper',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          <IconButton
                            onClick={() => toggleSlotCompletion(index)}
                            color={slot.completed ? 'success' : 'default'}
                          >
                            {slot.completed ? <CheckCircleIcon /> : <UncheckedIcon />}
                          </IconButton>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {slot.startTime} - {slot.endTime}
                              </Typography>
                              <Chip
                                label={slot.phase}
                                color={getPhaseColor(slot.phase)}
                                size="small"
                              />
                              {slot.pomodoroEnabled && (
                                <Chip
                                  icon={<TimerIcon />}
                                  label={`${slot.pomodoroDuration}m`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <span>
                              <span style={{ fontSize: '0.875rem', lineHeight: 1.43, display: 'block' }}>{slot.activity}</span>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: 1.66, display: 'block' }}>
                                {slot.purpose}
                              </span>
                            </span>
                          }
                        />
                        {(slot.linkedQuiz || slot.linkedContent) && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                            {slot.linkedQuiz && (
                              <Chip
                                icon={<SchoolIcon />}
                                label={`Quiz: ${slot.linkedQuiz.title}`}
                                size="small"
                                sx={{ alignSelf: 'flex-start' }}
                              />
                            )}
                            {slot.linkedContent && (
                              <Chip
                                icon={getContentIcon(slot.linkedContent.type)}
                                label={`Content: ${slot.linkedContent.title}`}
                                size="small"
                                sx={{ alignSelf: 'flex-start' }}
                              />
                            )}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {slot.pomodoroEnabled && !slot.completed && (
                            <Tooltip title="Start Pomodoro">
                              <IconButton
                                onClick={() => startPomodoro(slot.pomodoroDuration)}
                                color="primary"
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit Slot">
                            <IconButton
                              onClick={() => {
                                setSlotForm(slot);
                                setEditDialogOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                      {index < currentTimetable.timeSlots.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Upcoming Activities */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Upcoming Activities
                </Typography>
                {currentTimetable.timeSlots.filter(slot => !slot.completed).length > 0 ? (
                  <List>
                    {currentTimetable.timeSlots
                      .filter(slot => !slot.completed)
                      .slice(0, 3)
                      .map((slot, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AccessTimeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${slot.startTime} - ${slot.activity}`}
                            secondary={slot.purpose}
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    All activities completed for today! 🎉
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No timetable for {selectedDate.toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a personalized study schedule aligned with your energy patterns.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createDefaultTimetable}
              disabled={loading}
            >
              Create Today's Timetable
            </Button>
          </Paper>
        )}

        {/* Edit Slot Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Time Slot</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Activity"
                  value={slotForm.activity}
                  onChange={(e) => setSlotForm({ ...slotForm, activity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Phase</InputLabel>
                  <Select
                    value={slotForm.phase}
                    onChange={(e) => setSlotForm({ ...slotForm, phase: e.target.value })}
                  >
                    <MenuItem value="Prime Focus">Prime Focus</MenuItem>
                    <MenuItem value="Recharge">Recharge</MenuItem>
                    <MenuItem value="Rest">Rest</MenuItem>
                    <MenuItem value="Active Practice">Active Practice</MenuItem>
                    <MenuItem value="Revision">Revision</MenuItem>
                    <MenuItem value="Balance">Balance</MenuItem>
                    <MenuItem value="Light Prep">Light Prep</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Purpose"
                  multiline
                  rows={2}
                  value={slotForm.purpose}
                  onChange={(e) => setSlotForm({ ...slotForm, purpose: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={slotForm.pomodoroEnabled}
                      onChange={(e) => setSlotForm({ ...slotForm, pomodoroEnabled: e.target.checked })}
                    />
                  }
                  label="Enable Pomodoro Timer"
                />
              </Grid>
              {slotForm.pomodoroEnabled && (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Pomodoro Duration (minutes)"
                    type="number"
                    value={slotForm.pomodoroDuration}
                    onChange={(e) => setSlotForm({ ...slotForm, pomodoroDuration: parseInt(e.target.value) })}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={slotForm.spacedRepetition}
                      onChange={(e) => setSlotForm({ ...slotForm, spacedRepetition: e.target.checked })}
                    />
                  }
                  label="Enable Spaced Repetition"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={slotForm.notes}
                  onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              // Update slot logic here
              setEditDialogOpen(false);
            }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Timetable;
