import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './sidebar.css';

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const dragStartX = useRef(null);
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
                    });

                    socket.on('notification', (notification) => {
                        if (notification.userId === userData.id || notification.serviceCreatorId === userData.id) {
                            setUnreadCount((prevCount) => prevCount + 1);
                        }
                    });

                    socket.on('disconnect', (reason) => {

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

    useEffect(() => {
        const handleTouchStart = (e) => {
            dragStartX.current = e.touches[0].clientX;
        };

        const handleTouchMove = (e) => {
            if (dragStartX.current !== null) {
                const dragEndX = e.touches[0].clientX;
                if (dragEndX - dragStartX.current > 100) {
                    setIsSidebarOpen(true);
                } else if (dragStartX.current - dragEndX > 100) {
                    setIsSidebarOpen(false);
                }
            }
        };

        const handleTouchEnd = () => {
            dragStartX.current = null;
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    useEffect(() => {
        const handleMouseDown = (e) => {
            dragStartX.current = e.clientX;
        };

        const handleMouseMove = (e) => {
            if (dragStartX.current !== null) {
                const dragEndX = e.clientX;
                if (dragEndX - dragStartX.current > 100) {
                    setIsSidebarOpen(true);
                } else if (dragStartX.current - dragEndX > 100) {
                    setIsSidebarOpen(false);
                }
            }
        };

        const handleMouseUp = () => {
            dragStartX.current = null;
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

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

    return (
        <div className="main-container">
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
                            <i className="fa-solid fa-table-columns"></i>
                        </span>
                        <span>
                            <a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-heart"></i>
                        </span>
                        <span>
                        <a href="#" onClick={() => navigate('/favorites')}>Favorites</a>
                    </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-house"></i>
                        </span>
                        <span>
                            <a href="#" onClick={() => navigate('/home')}>Home</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-calendar-day"></i>
                        </span>
                        <span>
                            <a href="#" onClick={() => navigate('/bookings')}>Bookings</a>
                        </span>
                    </div>

                    <div className="link">
                        <span className="dash">
                            <i className="fa-solid fa-bell"></i>
                        </span>
                        <span>
                            <a href="#" onClick={handleNotificationsClick}>
                                Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                            </a>
                        </span>
                    </div>

                </div>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
            <div className={`content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                {/* Main content goes here */}
            </div>
        </div>
    );
};

export default Sidebar;
