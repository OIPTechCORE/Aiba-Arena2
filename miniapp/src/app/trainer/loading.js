export default function TrainerLoading() {
    return (
        <div style={{ padding: 24, maxWidth: 640, margin: '0 auto', minHeight: '100vh' }}>
            <div style={{ marginBottom: 20 }}>
                <div style={{ height: 28, width: 280, background: 'var(--bg-subtle)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, width: 200, background: 'var(--bg-subtle)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 90, height: 40, background: 'var(--bg-subtle)', borderRadius: 8 }} />
                <div style={{ width: 90, height: 40, background: 'var(--bg-subtle)', borderRadius: 8 }} />
            </div>
            <div style={{ padding: 20, border: '2px solid var(--border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 14 }}>
                Loading trainers…
            </div>
        </div>
    );
}
