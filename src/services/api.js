const BASE_URL = '/api';

const request = async (method, endpoint, data = null) => {
    const isFormData = data instanceof FormData;
    const options = {
        method,
        headers: {}
    };

    if (data) {
        options.body = isFormData ? data : JSON.stringify(data);
        if (!isFormData) {
            options.headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error in ${method} request`);
    }

    return response.json();
};

export const apiClient = {
    get: (endpoint) => request('GET', endpoint),
    post: (endpoint, data) => request('POST', endpoint, data),
    patch: (endpoint, data) => request('PATCH', endpoint, data),
    put: (endpoint, data) => request('PUT', endpoint, data),
    delete: (endpoint) => request('DELETE', endpoint)
};