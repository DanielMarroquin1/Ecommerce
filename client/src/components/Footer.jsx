export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h3>zzaly</h3>
                    <p>
                        Moda femenina contemporánea con un toque de elegancia atemporal.
                        Cada prenda es una expresión de estilo y sofisticación.
                    </p>
                </div>

                <div className="footer-col">
                    <h4>Tienda</h4>
                    <ul>
                        <li><a href="/catalogo">Novedades</a></li>
                        <li><a href="/catalogo?category=vestidos">Vestidos</a></li>
                        <li><a href="/catalogo?category=blusas">Blusas</a></li>
                        <li><a href="/catalogo?category=pantalones">Pantalones</a></li>
                        <li><a href="/catalogo?category=accesorios">Accesorios</a></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Información</h4>
                    <ul>
                        <li><a href="#">Sobre Nosotras</a></li>
                        <li><a href="#">Envíos</a></li>
                        <li><a href="#">Devoluciones</a></li>
                        <li><a href="#">Guía de Tallas</a></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Contacto</h4>
                    <ul>
                        <li><a href="#">hola@zzaly.com</a></li>
                        <li><a href="#">Instagram</a></li>
                        <li><a href="#">Pinterest</a></li>
                        <li><a href="#">WhatsApp</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                © 2026 zzaly. Todos los derechos reservados.
            </div>
        </footer>
    );
}
