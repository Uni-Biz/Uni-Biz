import React, { useEffect, useState } from 'react';
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
        <div className="dashboard">
            <div className="sidebar">
                <div className="profile">
                    <div className="profile-pic">
                        <img src={`data:image/png;base64,${profile.logo}`} alt="Profile Logo" />
                    </div>
                    <h3>{profile.businessName}</h3>
                    <button className="buttons" onClick={handleEditProfile}>Edit Profile</button>
                    <button className="buttons">Delete Profile</button>
                </div>
                <div className="menu">
                    <a href="#" className="active" onClick={() => navigate('/dashboard')}>Dashboard</a>
                    <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    <a href="#" onClick={() => navigate('/home')}>Home</a> {/* Add this line */}
                    <a href="#">Bookings</a>
                </div>
            </div>
            <div className="main-content">
                <div className="header">
                    <h1>Welcome, {user.first_name} {user.last_name}</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                        <button onClick={handleAddService}>Add Service</button>
                    </div>
                </div>
                <div className="cards">
                    {services.map(service => (
                        <div key={service.id} className="card" onClick={() => handleServiceClick(service)}>
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
