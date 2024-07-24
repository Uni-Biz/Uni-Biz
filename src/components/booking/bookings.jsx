import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from '../modal/modal.jsx';
import './bookings.css';
import Sidebar from '../sidebar/Sidebar.jsx';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [offeredBookings, setOfferedBookings] = useState([]);
    const [googleCalEvents, setGoogleCalEvents] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
        fetchOfferedBookings();
        fetchGoogleCal();
    }, []);

    const fetchGoogleCal = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/google-calendar/events`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch Google Calendar events');
            }
            const googleData = await response.json();
            setGoogleCalEvents(googleData);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/bookings`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }
            const bookingsData = await response.json();
            setBookings(bookingsData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOfferedBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/offered-bookings`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch offered bookings');
            }
            const offeredBookingsData = await response.json();
            setOfferedBookings(offeredBookingsData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEventClick = ({ event }) => {
        const booking = bookings.find(b => b.id === parseInt(event.id)) || offeredBookings.find(b => b.id === parseInt(event.id));
        setSelectedBooking(booking);
        setShowBookingModal(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const syncGoogleCalendar = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/auth-url`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to sync Google Calendar');
            }
            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error(error);
            alert('Failed to sync Google Calendar');
        }
    };

    return (
        <div className="bookings">
            <Sidebar />
            <div className="bookings-main-content">
                <h1>Your Bookings</h1>
                <button onClick={syncGoogleCalendar}>Sync Google Calendar</button>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    events={[
                        ...googleCalEvents.map(googleEvent => ({
                            start: googleEvent.startAt,
                            end: googleEvent.endAt,
                            title: googleEvent.title,
                            id: googleEvent.id,
                            backgroundColor: 'green', // Color for logged in user's Google Calendar events
                        })),
                        ...bookings.map(booking => ({
                            start: booking.time.startTime,
                            end: booking.time.endTime,
                            title: booking.service.serviceName,
                            id: booking.id,
                            backgroundColor: 'blue', // Color for services booked by the user
                        })),
                        ...offeredBookings.map(booking => ({
                            start: booking.time.startTime,
                            end: booking.time.endTime,
                            title: `${booking.service.serviceName} (Offered)`,
                            id: booking.id,
                            backgroundColor: 'orange', // Color for services offered by the user and booked by others
                        }))
                    ]}
                    eventClick={handleEventClick}
                />
            </div>
            {showBookingModal && selectedBooking && (
                <Modal isOpen={true} onClose={() => setShowBookingModal(false)}>
                    <div className="booking-details">
                        <h2>{selectedBooking.service.serviceName}</h2>
                        <p>{selectedBooking.service.description}</p>
                        <p>Service Type: {selectedBooking.service.serviceType}</p>
                        <p>Price: ${selectedBooking.service.price}</p>
                        <p>Time: {new Date(selectedBooking.time.startTime).toLocaleString()} - {new Date(selectedBooking.time.endTime).toLocaleString()}</p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Bookings;
