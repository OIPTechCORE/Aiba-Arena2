import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
    const api = useMemo(() => axios.create({ baseURL: BACKEND_URL }), []);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/api/admin/tasks');
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setError('Failed to load tasks. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>Admin Panel</h1>
            <div style={{ color: '#666', marginBottom: 12 }}>Backend: {BACKEND_URL}</div>

            <button onClick={fetchTasks} disabled={loading} style={{ padding: '8px 12px' }}>
                {loading ? 'Loading…' : 'Refresh tasks'}
            </button>

            {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

            <div style={{ marginTop: 12 }}>
                {tasks.length === 0 && !loading ? <p>No tasks yet.</p> : null}
                {tasks.map((t) => (
                    <div key={t._id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginTop: 8 }}>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        {t.description ? <div style={{ color: '#444', marginTop: 4 }}>{t.description}</div> : null}
                        {t.enabled === false ? <div style={{ color: '#b45309', marginTop: 6 }}>Disabled</div> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
