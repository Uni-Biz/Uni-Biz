import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faHeart, faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import Modal from '../modal/modal.jsx';
import Profile from '../user-profile/profile.jsx';
import AddServiceForm from '../add-service-form/add-service-form.jsx';
import Sidebar from '../sidebar/Sidebar.jsx';
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
    const [unreadCount, setUnreadCount] = useState(0);
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

    const handleFavoriteClick = (e, serviceId) => {
        e.stopPropagation();
        handleAddToFavorites(serviceId);
        e.currentTarget.classList.toggle('clicked');
    };

    const renderStars = (rating) => {
        const roundedRating = Math.round(rating * 2) / 2;
        const fullStars = Math.floor(roundedRating);
        const halfStar = roundedRating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(roundedRating);

        return (
            <>
                {[...Array(fullStars)].map((_, index) => (
                    <FontAwesomeIcon key={`full-${index}`} icon={faStar} />
                ))}
                {halfStar && <FontAwesomeIcon icon={faStarHalfAlt} />}
                {[...Array(emptyStars)].map((_, index) => (
                    <FontAwesomeIcon key={`empty-${index}`} icon={faStar} style={{ color: '#ccc' }} />
                ))}
            </>
        );
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard-dashboard">
            <Sidebar />
            <div className="dashboard-main-content">
                <div className="dashboard-header">
                    <h1>Welcome, {user.first_name} {user.last_name}</h1>
                    <div className="actions">
                        <button onClick={handleAddService}>Add Service</button>
                    </div>
                </div>
                <div className="dashboard-cards">
                    {services.map(service => (
                        <div key={service.id} className="dashboard-card" onClick={() => handleServiceClick(service)}>
                            <div className="dashboard-card-image-container">
                                <img className="dashboard-card-image" src={`data:image/png;base64,${service.image}`} alt="Service" />
                            </div>
                            <h2 className="dashboard-card-title">{service.serviceName}</h2>
                            <p className="dashboard-card-type">{service.serviceType}</p>
                            <p className="dashboard-card-business">{service.businessName}</p>
                            <p className="dashboard-card-description">{service.description}</p>
                            <p className="dashboard-card-price">${service.price.toFixed(2)}</p>
                            <div className="dashboard-card-rating">
                                {renderStars(service.averageRating || 0)}
                            </div>
                            <div className="dashboard-card-actions">
                                <button className="dashboard-card-delete-button" onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                                <button className="dashboard-card-favorite-button" onClick={(e) => handleFavoriteClick(e, service.id)}>
                                    <FontAwesomeIcon icon={faHeart} />
                                </button>
                            </div>
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
                        <h2 className="service-details-title">{selectedService.serviceName}</h2>
                        <p className="service-details-type">{selectedService.serviceType}</p>
                        <p className="service-details-description">{selectedService.description}</p>
                        <p className="service-details-rating">Average Rating: {selectedService.averageRating || 'No ratings yet'}</p>
                        <h3>Comments</h3>
                        <div className="service-details-comments">
                            {comments.map(comment => (
                                <div key={comment.id} className="service-details-comment">
                                    <p>
                                        {comment.user.username}: {comment.reviewText}
                                        {comment.user.id === user.id && (
                                            <button className="comment-delete-button" onClick={() => handleDeleteComment(selectedService.id, comment.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="service-details-add-comment">
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
