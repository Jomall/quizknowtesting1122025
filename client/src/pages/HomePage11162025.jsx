import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
} from '@mui/material';
import {
  School,
  Speed,
  Analytics,
  Group,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import quizAPI from '../services/quizAPI';

// QuizKnow Logo Component - Horizontal Flow with 3D Depth (Responsive)
const QuizKnowLogo = ({ size = 40, showText = true }) => {
  const letters = ['Q', 'U', 'I', 'Z', 'K', 'N', 'O', 'W'];
  const colors = ['#1e40af', '#059669']; // Blue-Green alternating

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
      {/* White Background Container */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: { xs: 2, sm: 4 },
          p: { xs: 2, sm: 3 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          maxWidth: '100%',
          width: 'auto',
        }}
      >
        {/* Letter Squares */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.25, sm: 0.5 },
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {letters.map((letter, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: size * 0.7, sm: size },
                height: { xs: size * 0.7, sm: size },
                bgcolor: colors[index % 2],
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: { xs: size * 0.28, sm: size * 0.4 },
                fontWeight: 'bold',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  borderRadius: 1,
                  transform: 'translateY(2px)',
                  zIndex: -1,
                },
              }}
            >
              {letter}
            </Box>
          ))}
        </Box>

        {/* Logo Text */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: '#1e40af',
              letterSpacing: { xs: 1, sm: 2 },
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2.125rem' },
            }}
          >
            QUIZKNOW
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#059669',
              fontSize: { xs: '0.75rem', sm: '0.9rem' },
              fontWeight: 500,
              lineHeight: 1.4,
              px: { xs: 1, sm: 0 },
            }}
          >
            Master Knowledge Through Interactive Quizzes
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Create Interactive Quizzes',
      description: 'Design engaging quizzes with various question types including multiple choice, true/false, and open-ended questions.',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Real-time Performance',
      description: 'Track student progress in real-time with instant feedback and detailed analytics.',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Advanced Analytics',
      description: 'Get comprehensive insights into quiz performance with detailed reports and statistics.',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Collaborative Learning',
      description: 'Share quizzes with students and colleagues, fostering a collaborative learning environment.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'High School Teacher',
      avatar: 'SJ',
      rating: 5,
      text: 'QuizKnow has revolutionized how I assess my students. The analytics are incredibly detailed!',
    },
    {
      name: 'Michael Chen',
      role: 'University Professor',
      avatar: 'MC',
      rating: 5,
      text: 'The platform is intuitive and my students love the interactive quizzes. Highly recommended!',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Corporate Trainer',
      avatar: 'ER',
      rating: 5,
      text: 'Perfect for training sessions. The real-time feedback helps me adjust my teaching on the fly.',
    },
  ];

  const [stats, setStats] = useState({
    activeUsers: '10K+',
    quizzesCreated: '50K+',
    questionsAnswered: '500K+',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await quizAPI.getGlobalStats();
        const data = response.data;
        setStats({
          activeUsers: data.activeUsers.toLocaleString(),
          quizzesCreated: data.quizzesCreated.toLocaleString(),
          questionsAnswered: data.questionsAnswered.toLocaleString(),
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep defaults
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <QuizKnowLogo size={80} />
          </Box>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Transform learning with interactive quizzes and comprehensive analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/quizzes')}
              sx={{ px: 4, py: 1.5 }}
            >
              Take a Quiz
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={() => navigate('/quiz-creator')}
              sx={{ px: 4, py: 1.5 }}
            >
              Create a Quiz
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Powerful Features for Educators
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Everything you need to create, manage, and analyze quizzes effectively
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ pt: 4 }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h3" color="primary.main" gutterBottom>
                {stats.activeUsers}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Active Users
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h3" color="primary.main" gutterBottom>
                {stats.quizzesCreated}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Quizzes Created
            </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h3" color="primary.main" gutterBottom>
                {stats.questionsAnswered}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Questions Answered
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h3" color="primary.main" gutterBottom>
                95%
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Satisfaction Rate
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          What Educators Say
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Trusted by thousands of educators worldwide
        </Typography>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{testimonial.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    "{testimonial.text}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of educators who are transforming learning with QuizKnow
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Sign Up Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={() => navigate('/quizzes')}
              sx={{ px: 4, py: 1.5 }}
            >
              Browse Quizzes
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
