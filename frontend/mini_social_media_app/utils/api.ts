const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

class API {
    static async request(endpoint: string, options: RequestOptions = {}) {
        const { token, headers, ...rest } = options;

        const config: RequestInit = {
            ...rest,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
        };

        try {
            console.log(`API Request: ${config.method || 'GET'} ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    console.error('API Error Response:', data);
                    throw new Error(data.error || 'Something went wrong');
                }
                return data;
            } else {
                // Handle non-JSON response (e.g. 404 HTML, 500 Text)
                const text = await response.text();
                console.error('API Non-JSON Response:', text);
                if (!response.ok) {
                    throw new Error(`API Error (${response.status}): ${text.substring(0, 100)}...`);
                }
                return { success: true, message: 'Operation successful' }; // Fallback? 
            }
        } catch (error: any) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    static get(endpoint: string, token?: string) {
        return this.request(endpoint, { method: 'GET', token });
    }

    static post(endpoint: string, body: any, token?: string) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            token,
        });
    }

    static put(endpoint: string, body: any, token?: string) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            token,
        });
    }

    static delete(endpoint: string, token?: string) {
        return this.request(endpoint, { method: 'DELETE', token });
    }

    static upload(endpoint: string, formData: FormData, token?: string) {
        return fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            return data;
        });
    }
}

export default API;
