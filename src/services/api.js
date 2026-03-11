const BASE_URL = '/api';

export const apiClient = {
    async get(endpoint) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },

    async post(endpoint, data) {
        const isFormData = data instanceof FormData;

        const options = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data)
        };

        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error('Error in POST request');
        return response.json();
    }
};