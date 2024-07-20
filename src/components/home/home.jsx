import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../modal/modal.jsx';
import './home.css';

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
            } catch (error) {
                console.error(error);
            }
        };
        fetchUserInfo();
    }, [navigate]);

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
            fetchComments(serviceId); // Refresh comments after deletion
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
            setShowBookingModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenBookingModal = async (service) => {
        setSelectedService(service);
        await fetchAvailableTimes(service.id);
        setShowBookingModal(true);
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    const profile = user.profile;

    return (
        <div className="home">
            <div className="home-sidebar">
                <div className="home-profile">
                    <div className="profile-pic">
                        <img src={`data:image/png;base64,${profile.logo}`} alt="Profile Logo" />
                    </div>
                    <h3>{profile.businessName}</h3>
                    <button className="home-buttons" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
                <div className="home-menu">
                    <a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a>
                    <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    <a href="#" className="active">Home</a>
                    <a href="#">Bookings</a>
                </div>
            </div>
            <div className="home-main-content">
                <div className="home-header">
                    <h1>Recommended Services</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                    </div>
                </div>
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
                <Modal isOpen={true} onClose={() => { setShowBookingModal(false); setSelectedService(null); setSelectedTime(null); }}>
                    <div className="booking-details">
                        <h2>Book a Slot for {selectedService.serviceName}</h2>
                        {availableTimes.length > 0 ? (
                            <ul>
                                {availableTimes.map(time => (
                                    <li key={time.id}>
                                        <button onClick={() => handleBookSlot(time.id)}>
                                            {new Date(time.startTime).toLocaleString()} - {new Date(time.endTime).toLocaleString()}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No available times.</p>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Home;
