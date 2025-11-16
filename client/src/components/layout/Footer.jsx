import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  GitHub,
  Email,
} from '@mui/icons-material';
import QuizKnowLogo from '../common/QuizKnowLogo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        py: 6,
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-evenly">
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ mb: 2 }}>
              <QuizKnowLogo variant="text-only" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Empowering education through interactive quizzes and assessments.
              Create, share, and learn with our comprehensive quiz platform.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Features
            </Typography>
            <Box>
              {['Create Quizzes', 'Take Quizzes', 'Track Progress', 'Analytics'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  color="text.secondary"
                  display="block"
                  variant="body2"
                  sx={{ mb: 1, textDecoration: 'none' }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Support
            </Typography>
            <Box>
              {['Help Center', 'Contact Us', 'Documentation', 'API'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  color="text.secondary"
                  display="block"
                  variant="body2"
                  sx={{ mb: 1, textDecoration: 'none' }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Company
            </Typography>
            <Box>
              {['About Us', 'Careers', 'Blog', 'Privacy Policy'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  color="text.secondary"
                  display="block"
                  variant="body2"
                  sx={{ mb: 1, textDecoration: 'none' }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} QuizKnow. All rights reserved.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
            <IconButton
              color="secondary"
              size="small"
              aria-label="Facebook"
              href="#"
            >
              <Facebook />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              aria-label="Twitter"
              href="#"
            >
              <Twitter />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              aria-label="Instagram"
              href="#"
            >
              <Instagram />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              aria-label="LinkedIn"
              href="#"
            >
              <LinkedIn />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              aria-label="GitHub"
              href="#"
            >
              <GitHub />
            </IconButton>
            <IconButton
              color="secondary"
              size="small"
              aria-label="Email"
              href="mailto:contact@quizknow.com"
            >
              <Email />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
