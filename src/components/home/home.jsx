import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Modal from '../modal/modal.jsx';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './home.css';
import Sidebar from '../sidebar/Sidebar.jsx';

function Home() {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [visibleServices, setVisibleServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [error, setError] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const ITEMS_PER_PAGE = 3;

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/info`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await response.json();
                setUser(userData);

                const unreadCountResponse = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications/unread-count`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const { unreadCount } = await unreadCountResponse.json();
                setUnreadCount(unreadCount);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUserInfo();

        // const socket = io('http://localhost:4500', {
        //     withCredentials: true,
        // });

        // socket.on('connect', () => {
        //     console.log('Connected to WebSocket server');
        // });

        // socket.on('notification', (notification) => {
        //     console.log('Received notification:', notification);
        //     if (notification.userId === user?.id || notification.serviceCreatorId === user?.id) {
        //         setNotifications((prevNotifications) => [...prevNotifications, notification]);
        //         setUnreadCount((prevCount) => {
        //             const newCount = prevCount + 1;
        //             // updateUnreadCountInDB(newCount); // Update the unread count in the database
        //             return newCount;
        //         });
        //         console.log(notification.userId);
        //         console.log(notification.serviceCreatorId);
        //     }
        // });

        // socket.on('disconnect', (reason) => {
        //     console.log('WebSocket connection closed:', reason);
        // });

        // socket.on('connect_error', (error) => {
        //     console.error('WebSocket connection error:', error);
        // });

        // socket.on('error', (error) => {
        //     console.error('WebSocket error:', error);
        // });

        // return () => {
        //     socket.disconnect();
        // };
    }, [navigate, user?.id]);

    // const updateUnreadCountInDB = async (count) => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         if (!token) {
    //             navigate('/login');
    //             return;
    //         }
    //         // await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications/update-unread-count`, {
    //         //     method: 'POST',
    //         //     headers: {
    //         //         'Authorization': `Bearer ${token}`,
    //         //         'Content-Type': 'application/json',
    //         //     },
    //         //     body: JSON.stringify({ unreadCount: count }),
    //         // });
    //     } catch (error) {
    //         console.error('Failed to update unread count in database:', error);
    //     }
    // };

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/recommended`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const servicesData = await response.json();
            setServices(servicesData);
            setVisibleServices(servicesData.slice(0, ITEMS_PER_PAGE));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/comments`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const commentsData = await response.json();
            setComments(commentsData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAvailableTimes = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/available-times`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch available times');
            }
            const timesData = await response.json();
            setAvailableTimes(timesData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddComment = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reviewText: newComment, rating: newRating }),
            });
            if (!response.ok) {
                throw new Error('Failed to add comment');
            }
            setNewComment('');
            setNewRating(0);
            fetchComments(serviceId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteComment = async (serviceId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }
            fetchComments(serviceId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleServiceClick = async (service) => {
        setSelectedService(service);
        fetchComments(service.id);
    };

    const handleLoadMore = () => {
        const newVisibleServices = services.slice(0, visibleServices.length + ITEMS_PER_PAGE);
        setVisibleServices(newVisibleServices);
    };

    const handleAddToFavorites = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to add to favorites');
            }
            alert('Service added to favorites');
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleBookSlot = async (timeId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/book-service`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceId: selectedService.id, timeId }),
            });
            if (!response.ok) {
                throw new Error('Failed to book slot');
            }
            alert('Booking successful');
            setAvailableTimes(availableTimes.filter(time => time.id !== timeId));
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenBookingModal = async (service) => {
        setSelectedService(service);
        await fetchAvailableTimes(service.id);
        setShowBookingModal(true);
    };

    const handleNotificationClick = async () => {
        setUnreadCount(0);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications/reset-unread-count`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const notificationsData = await response.json();
            navigate('/notifications', { state: { notifications: notificationsData } });
        } catch (error) {
            console.error(error);
        }
    };

    if (!user) {
        return <div className="loading-spinner"></div>;
    }

    const profile = user.profile;

    return (
        <div className="home">
            <Sidebar />
            <div className="home-main-content">
                <div className="home-header">
                    <h1>Recommended Services</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                    </div>
                </div>
                {loading ? (
                    <div className="loading-spinner"></div>
                ) : (
                    <>
                        {services.length === 0 ? (
                            <div className="no-recommendations">
                                <p>No services available yet.</p>
                            </div>
                        ) : (
                            <div className="home-cards">
                                {visibleServices.map(service => (
                                    <div key={service.id} className="home-card" onClick={() => handleServiceClick(service)}>
                                        <img src={`data:image/png;base64,${service.image}`} alt="Service" />
                                        <h2>{service.serviceName}</h2>
                                        <p>{service.serviceType}</p>
                                        <p>{service.businessName}</p>
                                        <p>{service.description}</p>
                                        <p>${service.price.toFixed(2)}</p>
                                        <p>Average Rating: {service.averageRating || 'No ratings yet'}</p>
                                        {service.availableTimes && service.availableTimes.length > 0 && (
                                            <button className="home-booking-button" onClick={(e) => { e.stopPropagation(); handleOpenBookingModal(service); }}>
                                                Book Now
                                            </button>
                                        )}
                                        <button className="home-favorite-button" onClick={(e) => { e.stopPropagation(); handleAddToFavorites(service.id); }}>Favorite</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {visibleServices.length < services.length && (
                            <button className="home-load-more" onClick={handleLoadMore}>Load More</button>
                        )}
                    </>
                )}
            </div>
            {selectedService && !showBookingModal && (
                <Modal isOpen={true} onClose={() => { setSelectedService(null); }}>
                    <div className="service-details">
                        <h2>{selectedService.serviceName}</h2>
                        <p>{selectedService.serviceType}</p>
                        <p>{selectedService.description}</p>
                        <p>Average Rating: {selectedService.averageRating || 'No ratings yet'}</p>
                        <h3>Comments</h3>
                        <div className="home-comments">
                            {comments.map(comment => (
                                <div key={comment.id} className="home-comment">
                                    <p><strong>{comment.user.username}</strong>: {comment.reviewText}</p>
                                    {comment.user.id === user.id && (
                                        <button onClick={() => handleDeleteComment(selectedService.id, comment.id)}>Delete</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="home-add-comment">
                            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment"></textarea>
                            <input type="number" value={newRating} onChange={e => setNewRating(parseInt(e.target.value))} placeholder="Rate (1-5)" min="1" max="5" />
                            <button onClick={() => handleAddComment(selectedService.id)}>Submit Comment</button>
                        </div>
                    </div>
                </Modal>
            )}
            {showBookingModal && selectedService && (
                <Modal isOpen={true} onClose={() => { setShowBookingModal(false); setSelectedService(null); }}>
                    <div className="booking-details">
                        <h2>Book a Slot for {selectedService.serviceName}</h2>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            selectable={false}
                            events={availableTimes.map(time => ({
                                start: time.startTime,
                                end: time.endTime,
                                title: time.isBooked ? 'Booked' : 'Available',
                                id: time.id,
                                backgroundColor: time.isBooked ? 'red' : 'green',
                            }))}
                            eventClick={({ event }) => {
                                if (!event.extendedProps.isBooked) {
                                    handleBookSlot(event.id);
                                }
                            }}
                        />
                        {availableTimes.length === 0 && <p>No available times.</p>}
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Home;
