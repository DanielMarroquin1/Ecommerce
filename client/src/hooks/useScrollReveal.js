import { useEffect } from 'react';

export default function useScrollReveal() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.reveal-on-scroll:not(.revealed)');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    });
}
