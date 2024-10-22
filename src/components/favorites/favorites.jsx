import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Modal from '../modal/modal.jsx';
import './favorites.css';
import Sidebar from '../sidebar/Sidebar.jsx';

function Favorites() {
    const [user, setUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(() => {
        const storedCount = localStorage.getItem('unreadCount') || '0';
        return parseInt(storedCount);
    });

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
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/favorites`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch favorite services');
            }
            const favoritesData = await response.json();
            setFavorites(favoritesData);
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

    const handleRemoveFromFavorites = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/services/${serviceId}/favorite`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to remove from favorites');
            }
            setFavorites(favorites.filter(service => service.id !== serviceId));
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleNotificationClick = async () => {
        setUnreadCount(0);
        localStorage.setItem(`unreadCount_${user?.id}`, '0'); // Reset unread count in local storage
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

    if (!user) {
        return <div>Loading...</div>;
    }

    const profile = user.profile;

    return (
        <div className="favorites-page">
            <Sidebar />
            <div className="favorites-main-content">
                <div className="favorites-header">
                    <h1>Your Favorite Services</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                    </div>
                </div>
                <div className="favorites-cards">
                    {favorites.map(service => (
                        <div key={service.id} className="favorites-card" onClick={() => handleServiceClick(service)}>
                            <img src={`data:image/png;base64,${service.image}`} alt="Service" />
                            <h2>{service.serviceName}</h2>
                            <p>{service.serviceType}</p>
                            <p>{service.businessName}</p>
                            <p>{service.description}</p>
                            <p>${service.price.toFixed(2)}</p>
                            <p>Average Rating: {service.averageRating || 'No ratings yet'}</p>
                            <button className="favorites-remove-favorite-button" onClick={(e) => { e.stopPropagation(); handleRemoveFromFavorites(service.id); }}>Remove Favorite</button>
                        </div>
                    ))}
                </div>
            </div>
            {selectedService && (
                <Modal isOpen={true} onClose={() => setSelectedService(null)}>
                    <div className="service-details">
                        <h2>{selectedService.serviceName}</h2>
                        <p>{selectedService.serviceType}</p>
                        <p>{selectedService.description}</p>
                        <p>Average Rating: {selectedService.averageRating || 'No ratings yet'}</p>
                        <h3>Comments</h3>
                        <div className="favorite-comments">
                            {comments.map(comment => (
                                <div key={comment.id} className="favorite-comment">
                                    <p><strong>{comment.user.username}</strong>: {comment.reviewText}</p>
                                    {comment.user.id === user.id && (
                                        <button onClick={() => handleDeleteComment(selectedService.id, comment.id)}>Delete</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="favorites-add-comment">
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

export default Favorites;
