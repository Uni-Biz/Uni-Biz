import React from 'react';
import { useLocation } from 'react-router-dom';
import './notifications.css';

const Notifications = () => {
    const location = useLocation();
    const notifications = location.state?.notifications || [];

    return (
        <div className="notifications">
            <h1>Notifications</h1>
            {notifications.length === 0 ? (
                <p>No notifications</p>
            ) : (
                notifications.map((notification, index) => (
                    <div key={index} className="notification">
                        {notification.content}
                    </div>
                ))
            )}
        </div>
    );
};

export default Notifications;
