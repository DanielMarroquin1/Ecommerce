import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const slides = [
    {
        image: '/images/hero1.png',
        title: 'Nueva Colección Primavera',
        subtitle: 'Descubre las últimas tendencias en moda femenina. Piezas únicas diseñadas para ti.',
        cta: 'Explorar Colección',
    },
    {
        image: '/images/hero2.png',
        title: 'Elegancia sin Esfuerzo',
        subtitle: 'Nuestra selección de prendas premium combina confort y estilo para tu día a día.',
        cta: 'Ver Novedades',
    },
    {
        image: '/images/hero3.png',
        title: 'Viste tu Esencia',
        subtitle: 'Encuentra tu estilo con nuestra colección cuidadosamente curada para la mujer moderna.',
        cta: 'Comprar Ahora',
    },
];

export default function HeroCarousel() {
    return (
        <section className="hero-section">
            <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{
                    delay: 4500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                }}
                pagination={{
                    clickable: true,
                }}
                loop={true}
                speed={1200}
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={index}>
                        <div className="hero-slide">
                            <img src={slide.image} alt={slide.title} />
                            <div className="hero-overlay">
                                <div className="hero-content">
                                    <h1>{slide.title}</h1>
                                    <p>{slide.subtitle}</p>
                                    <Link to="/catalogo" className="hero-cta">
                                        {slide.cta}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
