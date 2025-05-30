import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Button, CircularProgress, Alert, TextField } from '@mui/material';
import { CiLocationOn } from "react-icons/ci";
import { IoTodayOutline, IoTicketOutline } from "react-icons/io5";
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`);
        setEvents(response.data.data || response.data); // Handle both response formats
        setLoading(false);
      } catch (err) {
        setError('frontend show error', err.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleGetTickets = (event) => {
    setSelectedEvent(event);
    setShowEmailModal(true);
  };

  const handleSubmitEmail = (e) => {
    e.preventDefault();
    // In a real app, you would send this to your backend
    console.log(`Email registered: ${email} for event: ${selectedEvent.eventName}`);
    window.open(selectedEvent.ticketLink, '_blank');
    setShowEmailModal(false);
    setEmail('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>Loading Sydney Events...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="error-alert">
        Failed to load events: {error}
      </Alert>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" gutterBottom>
            Sydney Events
          </Typography>
          <Typography variant="subtitle1">
            Discover the best events happening in Sydney
          </Typography>
        </Container>
      </header>

      <main>
        <Container maxWidth="lg" className="events-container">
          <Grid container spacing={4}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.id || event.eventName}>
                <Card className="event-card">
                  {event.image.src && (
                    <CardMedia
                      component="img"
                      height="200"
                      width="100"
                      image={event.image.src.startsWith('//') ? `https:${event.image.src}` : event.image.src}
                      alt={event.image.alt}
                    />
                  )}
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {event.eventName}
                    </Typography>
                    <div className="event-detail">
                      <CiLocationOn color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </div>
                    <div className="event-detail">
                      <IoTodayOutline color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        {event.date}
                      </Typography>
                    </div>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<IoTicketOutline />}
                      onClick={() => handleGetTickets(event)}
                      className="ticket-button"
                    >
                      Get Tickets
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="email-modal">
            <Typography variant="h5" gutterBottom>
              Get Tickets for {selectedEvent?.eventName}
            </Typography>
            <form onSubmit={handleSubmitEmail}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <div className="form-actions">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Continue to Tickets
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowEmailModal(false)}
                  size="large"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <Container maxWidth="lg">
          <Typography variant="body2">
            Events data sourced from Ticketek
          </Typography>
        </Container>
      </footer>
    </div>
  );
}

export default App;