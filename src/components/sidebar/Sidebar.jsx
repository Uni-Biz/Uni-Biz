import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './sidebar.css';

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

                    socket.on('notification', (notification) => {
                        if (notification.userId === userData.id || notification.serviceCreatorId === userData.id) {
                            setUnreadCount((prevCount) => prevCount + 1);
                        }
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

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleOpenSidebar = (e) => {
        e.stopPropagation();
        setIsSidebarOpen(true);
    };

    return (
        <div className={`main-container ${isSidebarOpen ? 'sidebar-open' : ''}`} onClick={handleCloseSidebar}>
            <div>
             {isSidebarOpen && (
                    <button className="toggle-sidebar-button" onClick={() => setIsSidebarOpen(false)}>
                        ❮
                    </button>
                )}
            </div>
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                {user && (
                    <div className="home-profile">
                        <span className="profile-pic">
                            <img src={`data:image/png;base64,${user.profile.logo}`} alt="Profile Logo" />
                        </span>
                        <span className="profile-name">
                            <h3>{user.profile.businessName}</h3>
                        </span>
                    </div>
                )}
                <hr className="white-line" />
                <div className="home-menu">
                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-table-columns fa-2x"></i>
                        </span>
                        <span className="dashboard-link">
                            <a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-heart fa-2x"></i>
                        </span>
                        <span className="favorites">
                            <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-house fa-2x"></i>
                        </span>
                        <span className="house">
                            <a href="#" onClick={() => navigate('/home')}>Home</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-calendar-day fa-2x"></i>
                        </span>
                        <span className="book">
                            <a href="#" onClick={() => navigate('/bookings')}>Bookings</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-bell fa-2x"></i>
                        </span>
                        <span className="notif">
                            <a href="#" onClick={handleNotificationsClick}>
                                Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                            </a>
                        </span>
                    </div>
                </div>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
            <div className="content">
                {/* Main content goes here */}
            </div>
            {!isSidebarOpen && (
                <button className="toggle-sidebar-button-open" onClick={handleOpenSidebar}>
                    ❯
                </button>
            )}
        </div>
    );
};

export default Sidebar;
