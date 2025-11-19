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
import QuizKnowLogo from '../components/common/QuizKnowLogo';

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
    satisfactionRate: 95,
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
          satisfactionRate: data.satisfactionRate || 95,
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
