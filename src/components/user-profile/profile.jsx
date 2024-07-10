import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';

function Profile() {
    const [logo, setLogo] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogoChange = (event) => {
        setLogo(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = `${import.meta.env.VITE_BACKEND_ADDRESS}/api/create-profile`;

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
        formData.append('logo', logo);  // Adding the file to FormData
        formData.append('businessName', businessName);
        formData.append('bio', bio);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found, please login again');
                return;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                navigate('/dashboard');
            } else {
                setError(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            setError('Operation failed. Please try again.');
            console.error(error);
        }
    };

    return (
        <div className="container">
            <div className="form-container">
                <h1>Create Business Profile</h1>
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
                    <button type="submit">Create Profile</button>
                </form>
            </div>
        </div>
    );
}

export default Profile;
