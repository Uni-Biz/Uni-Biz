import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './sidebar.css';

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility
    const navigate = useNavigate();
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchUserInfoAndUnreadCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [userResponse, unreadCountResponse] = await Promise.all([
                    fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/info`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }),
                    fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/notifications/unread-count`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }),
                ]);

                if (!userResponse.ok || !unreadCountResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const userData = await userResponse.json();
                const { unreadCount } = await unreadCountResponse.json();

                setUser(userData);
                setUnreadCount(unreadCount);

                if (!socketRef.current) {
                    const socket = io('http://localhost:4500', {
                        withCredentials: true,
                    });

                    socket.on('connect', () => {
                        console.log('Connected to WebSocket server');
                    });

                    socket.on('notification', (notification) => {
                        console.log('Received notification:', notification);
                        if (notification.userId === userData.id || notification.serviceCreatorId === userData.id) {
                            setUnreadCount((prevCount) => prevCount + 1);
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

                    socketRef.current = socket;
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchUserInfoAndUnreadCount();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleNotificationsClick = async () => {
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

            setUnreadCount(0);
            navigate('/notifications');
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen); // Toggle sidebar visibility
    };

    return (
        <div>
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {user && (
                    <div className="home-profile">
                        <div className="profile-pic">
                            <img src={`data:image/png;base64,${user.profile.logo}`} alt="Profile Logo" />
                        </div>
                        <h3>{user.profile.businessName}</h3>
                    </div>
                )}
                <div className="home-menu">
                    <a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a>
                    <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    <a href="#" onClick={() => navigate('/home')}>Home</a>
                    <a href="#" onClick={() => navigate('/bookings')}>Bookings</a>
                    <a href="#" onClick={handleNotificationsClick}>
                        Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                    </a>
                </div>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
            <button className="hamburger-button" onClick={toggleSidebar}>
                ☰
            </button>
        </div>
    );
};

export default Sidebar;
