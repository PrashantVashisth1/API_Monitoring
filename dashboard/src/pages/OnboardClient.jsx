import React, { useState } from 'react';
import { adminApi } from '../api/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const OnboardClient = () => {
    const [formData, setFormData] = useState({
        name: '',       // Company Name
        email: '',      // Email add ho gaya
        username: '',
        password: ''
    });
    const [status, setStatus] = useState({ loading: false, error: null, success: null });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: null, success: null });

        try {
            // Single API call to your backend onboard route
            await adminApi.onboardClient({
                name: formData.name,
                email: formData.email,
                username: formData.username,
                password: formData.password,
            });

            setStatus({ 
                loading: false, 
                error: null, 
                success: 'Client successfully onboarded! 🎉' 
            });
            
            // Clear form
            setFormData({ name: '', email: '', username: '', password: '' });

        } catch (error) {
            console.error("🚨 ASLI ERROR YAHAN HAI:", error);
            setStatus({ 
                loading: false, 
                // Error array (jaise "Path email is required") ko handle karne ke liye
                error: error.response?.data?.error?.[0] || error.response?.data?.message || 'Failed to onboard client', 
                success: null 
            });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <Card>
                <CardHeader>
                    <CardTitle>Onboard New Client</CardTitle>
                    <CardDescription>
                        Create a new workspace and admin account for a client.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Company Name</label>
                            <Input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="e.g. Zomato" 
                                required 
                            />
                        </div>

                        {/* 👇 Nayi Email Field */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Client Email</label>
                            <Input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="admin@zomato.com" 
                                required 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin Username</label>
                            <Input 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                placeholder="zomato_admin" 
                                required 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password</label>
                            <Input 
                                type="password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                placeholder="Secure password" 
                                required 
                            />
                        </div>

                        {status.error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{status.error}</p>}
                        {status.success && <p style={{ color: 'green', fontSize: '0.9rem' }}>{status.success}</p>}

                        <Button type="submit" disabled={status.loading}>
                            {status.loading ? 'Onboarding...' : 'Create Client Workspace'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardClient;