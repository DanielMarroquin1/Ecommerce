import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    fontFamily: 'inherit',
                    color: '#2C1810'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#fde8e8',
                        color: '#c81e1e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        marginBottom: '1.5rem'
                    }}>
                        !
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                        Algo salió mal
                    </h2>
                    <p style={{ maxWidth: '480px', color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Ocurrió un problema al cargar esta sección. Puedes intentar recargar la página o volver al inicio.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#5D4032',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Recargar página
                        </button>
                        <a
                            href="/"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: '#fff',
                                color: '#5D4032',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'background 0.2s'
                            }}
                        >
                            Ir al inicio
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
