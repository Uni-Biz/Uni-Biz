import React, { useState, useEffect } from 'react';
import './profile.css';

function Profile({ onClose }) {
    const [logo, setLogo] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found, please login again');
                return;
            }
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/info`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.profile) {
                        setBusinessName(userData.profile.businessName);
                        setBio(userData.profile.bio);
                        setIsEdit(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
                setError('Failed to fetch profile');
            }
        };

        fetchUserProfile();
    }, []);

    const handleLogoChange = (event) => {
        setLogo(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = `${import.meta.env.VITE_BACKEND_ADDRESS}/api/${isEdit ? 'update-profile' : 'create-profile'}`;

        const errors = [];
        if (!businessName) {
            errors.push("Name");
        }
        if (!bio) {
            errors.push("Bio");
        }
        if (errors.length > 0) {
            const message = `Please fill in: ${errors.join(", ")}`;
            setError(message);
            return;
        }

        const formData = new FormData();
        if (logo) {
            formData.append('logo', logo);
        }
        formData.append('businessName', businessName);
        formData.append('bio', bio);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found, please login again');
                return;
            }

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                onClose();
            } else {
                setError(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            setError('Operation failed. Please try again.');
            console.error(error);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-form-container">
                <h1>{isEdit ? 'Edit Business Profile' : 'Create Business Profile'}</h1>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="logo">Logo:</label>
                        <input type="file" id="logo" onChange={handleLogoChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="businessName">Business Name:</label>
                        <input
                            type="text"
                            id="businessName"
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio">Description:</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                        />
                    </div>
                    <button type="submit">{isEdit ? 'Update Profile' : 'Create Profile'}</button>
                </form>
            </div>
        </div>
    );
}

export default Profile;
