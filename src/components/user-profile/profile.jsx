import React, { useState } from 'react';
import './profile.css'; // Make sure the path matches your CSS file

function Profile() {
    const [logo, setLogo] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleLogoChange = (event) => {
        setLogo(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!logo || !businessName || !description) {
            setError('Please fill in all fields');
            return;
        }

        const formData = new FormData();
        formData.append('logo', logo);
        formData.append('businessName', businessName);
        formData.append('description', description);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/user/profile`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Handle success
                console.log('Profile created:', data);
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
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <button type="submit">Create Profile</button>
                </form>
            </div>
        </div>
    );
}

export default  Profile;
