import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function Nosotros() {
    useScrollReveal();

    return (
        <div className="nosotros-page">
            <div className="hero-section" style={{ height: '60vh', minHeight: '400px' }}>
                <div className="hero-slide">
                    <img src="/images/hero1.jpg" alt="Vibrante" style={{ filter: 'brightness(0.7)' }} />
                    <div className="hero-overlay" style={{ justifyContent: 'center', textAlign: 'center' }}>
                        <div className="hero-content">
                            <h1 style={{ marginBottom: '0.5rem' }}>Nuestra Historia</h1>
                            <p style={{ fontSize: '1.2rem', margin: 0 }}>Elevando la moda femenina desde 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="section">
                <div className="section-header reveal-on-scroll">
                    <h2>Sobre Zzaly</h2>
                    <div className="divider"></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', margin: '4rem 0' }} className="reveal-on-scroll">
                    <div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--espresso)' }}>Nuestra Misión</h3>
                        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.8', marginBottom: '1rem' }}>
                            En Zzaly, creemos que la moda es más que ropa; es una forma de expresión personal, empoderamiento y confianza. Nacimos de la idea de proporcionar prendas exclusivas que combinan a la perfección elegancia atemporal con tendencias modernas.
                        </p>
                        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.8' }}>
                            Cada diseño en nuestra tienda es cuidadosamente seleccionado y curado, pensado para mujeres modernas que no quieren sacrificar la comodidad por el estilo. Buscamos llevar la alta costura al guardarropa del día a día.
                        </p>
                    </div>
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <img src="/images/hero2.jpg" alt="Zzaly Design" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', margin: '4rem 0' }} className="reveal-on-scroll">
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <img src="/images/hero3.jpg" alt="Zzaly Quality" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--espresso)' }}>Compromiso con la Calidad</h3>
                        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.8', marginBottom: '1rem' }}>
                            Prestamos atención a los detalles infinitos. Desde la caída de una blusa de seda natural hasta la estructura de un blazer entallado, nuestra calidad reside en la selección de materiales premium y acabados impecables.
                        </p>
                        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.8' }}>
                            Nuestro equipo está dedicado a ofrecer una experiencia premium no solo en nuestros productos, sino también en el servicio que te brindamos a través de esta plataforma interactiva y segura.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
