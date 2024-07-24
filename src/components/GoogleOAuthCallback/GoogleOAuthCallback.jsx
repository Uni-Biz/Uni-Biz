import React from "react";
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function GoogleOAuthCallback () {
    const navigate = useNavigate();
    useEffect(() => {
        const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            fetch('http://localhost:3001/api/google-calendar/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code }),
            })
            .then(response => response.json())
            .then(data => {
                // Handle response data, e.g., redirect to a dashboard
                syncGoogleCalendar();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }, [navigate]);

    const syncGoogleCalendar = () => {
        const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
        fetch('http://localhost:3001/api/google-calendar/sync', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
        .then(response => {
            if (response.ok) {
                // Redirect to the calendar view on successful sync
                navigate('/bookings');
            } else {
                throw new Error('Failed to sync calendar');
            }
        })
        .catch(error => {
            console.error('Error syncing Google Calendar:', error);
        });
    };
    return (
        <div>
            <h1>Processing...</h1>
            <p>Please wait while we authenticate your account.</p>
        </div>
    )
}

export default GoogleOAuthCallback;
