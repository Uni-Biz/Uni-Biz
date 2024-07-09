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
        const url = `${import.meta.env.VITE_BACKEND_ADDRESS}/api/create-profile`
        const body = JSON.stringify({ businessName, bio });
        if (!businessName || !bio) {
            setError('Please fill in Name and Bio');
            return;
        }

        // const formData = new FormData();
        // formData.append('logo', logo);
        // formData.append('businessName', businessName);
        // formData.append('bio', bio);
        // console.log(formData)
        try {
            const token = localStorage.getItem('token');
            console.log(token)
            if (!token) {
                setError('No token found, please login again');
                return;
            }

            console.log("trying to fetch from", url)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: body
            });
            console.log("Response:", response);

            const data = await response.json();
            console.log("DATA:", data)
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
