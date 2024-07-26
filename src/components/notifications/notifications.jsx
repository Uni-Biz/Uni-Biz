import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../sidebar/Sidebar.jsx';
import './notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
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
                setNotifications(notificationsData);
            } catch (error) {
                console.error(error);
            }
        };

        fetchNotifications();
    }, [navigate]);

    const handleDeleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            // Remove the deleted notification from the state
            setNotifications((prevNotifications) =>
                prevNotifications.filter((notification) => notification.id !== notificationId)
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="notifications-home">
            <Sidebar />
            <div className="notifications">
                <h1>Notifications</h1>
                <div>
                    {notifications.map((notification) => (
                        <div key={notification.id} className="notification-card">
                            <div className="notification-content">
                                <p>{notification.content}</p>
                                <p className="timestamp">{new Date(notification.timestamp).toLocaleString()}</p>
                            </div>
                            <button
                                className="delete-button"
                                onClick={() => handleDeleteNotification(notification.id)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
