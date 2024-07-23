import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from '../modal/modal.jsx';
import './bookings.css';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [offeredBookings, setOfferedBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
        fetchOfferedBookings();
    }, []);

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

    return (
        <div className="bookings">
            <div className="bookings-sidebar">
                <div className="home-profile">
                    <div className="profile-pic">
                        {/* <img src={`data:image/png;base64,${user.profile.logo}`} alt="Profile Logo" /> */}
                    </div>
                    {/* <h3>{user.profile.businessName}</h3> */}
                    <button className="home-buttons" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
                <div className="home-menu">
                    <a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a>
                    <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    <a href="#" onClick={() => navigate('/home')}>Home</a>
                    <a href="#" className="active" onClick={() => navigate('/bookings')}>Bookings</a>
                    <a href="#" onClick={() => navigate('/notifications')}>Notifications</a>
                </div>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
            <div className="bookings-main-content">
                <h1>Your Bookings</h1>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    events={[
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
