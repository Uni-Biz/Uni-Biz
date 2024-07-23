import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Modal from '../modal/modal.jsx';
import Profile from '../user-profile/profile.jsx';
import AddServiceForm from '../add-service-form/add-service-form.jsx';
import './dashboard.css';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(parseInt(localStorage.getItem('unreadCount')) || 0);
    const navigate = useNavigate();

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

        const socket = io('http://localhost:4500', {
            withCredentials: true,
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('notification', (notification) => {
            console.log('Received notification:', notification);
            if (notification.userId === user?.id || notification.serviceCreatorId === user?.id) {
                setNotifications((prevNotifications) => [...prevNotifications, notification]);
                setUnreadCount((prevCount) => {
                    const newCount = prevCount + 1;
                    localStorage.setItem('unreadCount', newCount);
                    return newCount;
                });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('WebSocket connection closed:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        return () => {
            socket.disconnect();
        };
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
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services`, {
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

    const handleDeleteService = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete service');
            }
            setServices(services.filter(service => service.id !== serviceId));
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

    const handleNotificationClick = async () => {
        setUnreadCount(0);
        localStorage.setItem('unreadCount', 0); // Reset unread count in local storage
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleEditProfile = () => {
        setIsProfileModalOpen(true);
    };

    const handleAddService = () => {
        setIsServiceModalOpen(true);
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    const handleCloseServiceModal = () => {
        setIsServiceModalOpen(false);
        fetchServices();
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    const profile = user.profile;

    return (
        <div className="dashboard-dashboard">
            <div className="dashboard-sidebar">
                <div className="dashboard-profile">
                    <div className="profile-pic">
                        <img src={`data:image/png;base64,${profile.logo}`} alt="Profile Logo" />
                    </div>
                    <h3>{profile.businessName}</h3>
                    <button className="dashboard-buttons" onClick={handleEditProfile}>Edit Profile</button>
                    <button className="dashboard-buttons">Delete Profile</button>
                </div>
                <div className="dashboard-menu">
                    <a href="#" className="active" onClick={() => navigate('/dashboard')}>Dashboard</a>
                    <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    <a href="#" onClick={() => navigate('/home')}>Home</a>
                    <a href="#" onClick={() => navigate('/bookings')}>Bookings</a>
                    <a href="#" onClick={handleNotificationClick}>
                        Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                    </a>
                </div>
            </div>
            <div className="dashboard-main-content">
                <div className="dashboard-header">
                    <h1>Welcome, {user.first_name} {user.last_name}</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                        <button onClick={handleAddService}>Add Service</button>
                    </div>
                </div>
                <div className="dashboard-cards">
                    {services.map(service => (
                        <div key={service.id} className="dashboard-card" onClick={() => handleServiceClick(service)}>
                            <img src={`data:image/png;base64,${service.image}`} alt="Service" />
                            <h2>{service.serviceName}</h2>
                            <p>{service.serviceType}</p>
                            <p>{service.businessName}</p>
                            <p>{service.description}</p>
                            <p>${service.price.toFixed(2)}</p>
                            <p>Average Rating: {service.averageRating || 'No ratings yet'}</p>
                            <button className="delete-button" onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}>Delete</button>
                            <button className="favorite-button" onClick={(e) => { e.stopPropagation(); handleAddToFavorites(service.id); }}>Favorite</button>
                        </div>
                    ))}
                </div>
            </div>
            <Modal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal}>
                <Profile onClose={handleCloseProfileModal} />
            </Modal>
            <Modal isOpen={isServiceModalOpen} onClose={handleCloseServiceModal}>
                <AddServiceForm onClose={handleCloseServiceModal} />
            </Modal>
            {selectedService && (
                <Modal isOpen={true} onClose={() => setSelectedService(null)}>
                    <div className="service-details">
                        <h2>{selectedService.serviceName}</h2>
                        <p>{selectedService.serviceType}</p>
                        <p>{selectedService.description}</p>
                        <p>Average Rating: {selectedService.averageRating || 'No ratings yet'}</p>
                        <h3>Comments</h3>
                        <div className="comments">
                            {comments.map(comment => (
                                <div key={comment.id} className="comment">
                                    <p><strong>{comment.user.username}</strong>: {comment.reviewText}</p>
                                    {comment.user.id === user.id && (
                                        <button onClick={() => handleDeleteComment(selectedService.id, comment.id)}>Delete</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="add-comment">
                            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment"></textarea>
                            <input type="number" value={newRating} onChange={e => setNewRating(parseInt(e.target.value))} placeholder="Rate (1-5)" min="1" max="5" />
                            <button onClick={() => handleAddComment(selectedService.id)}>Submit Comment</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Dashboard;
