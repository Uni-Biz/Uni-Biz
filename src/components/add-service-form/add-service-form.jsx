import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './add-service-form.css';

const AddServiceForm = ({ onClose }) => {
    const [serviceType, setServiceType] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [error, setError] = useState('');
    const serviceTypes = ['Hair', 'Clothes', 'Food', 'Cosmetic']; // Replace with actual service types

    const handleDateSelect = (selectInfo) => {
        let calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // clear date selection

        const startTime = selectInfo.startStr;
        const endTime = selectInfo.endStr;

        setAvailableTimes([...availableTimes, { startTime, endTime }]);
    };

    const handleEventClick = (clickInfo) => {
        if (window.confirm(`Are you sure you want to delete this event?`)) {
            clickInfo.event.remove();
            setAvailableTimes(availableTimes.filter(time => time.startTime !== clickInfo.event.startStr));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = `${import.meta.env.VITE_BACKEND_ADDRESS}/api/create-service`;
        const formData = new FormData();
        formData.append('serviceType', serviceType);
        formData.append('serviceName', serviceName);
        formData.append('description', description);
        formData.append('price', price);
        if (image) {
            formData.append('image', image);
        }
        if (availableTimes.length > 0) {
            formData.append('availableTimes', JSON.stringify(availableTimes));
        }

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
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to add service');
            }

            onClose();
        } catch (error) {
            console.error(error);
            setError('Failed to add service. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Service Type:
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option value="" disabled>Select Service Type</option>
                    {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </label>
            <label>
                Service Name:
                <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
            </label>
            <label>
                Description:
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <label>
                Price:
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </label>
            <label>
                Service Image:
                <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            </label>
            <div>
                <label>Available Times (Optional):</label>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    events={availableTimes.map(time => ({
                        start: time.startTime,
                        end: time.endTime
                    }))}
                />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Add Service</button>
        </form>
    );
};

export default AddServiceForm;
