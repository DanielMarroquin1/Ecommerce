import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('zzaly_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage', error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('zzaly_cart', JSON.stringify(items));
    }, [items]);

    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    }, []);

    const addItem = useCallback((product, size, color, quantity = 1) => {
        setItems(prev => {
            const key = `${product.id}-${size}-${color}`;
            const existing = prev.find(item => item.key === key);
            if (existing) {
                return prev.map(item =>
                    item.key === key
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            // Encontrar la variante específica del producto según talla y color
            const matchedVariant = product.variants?.find(v => 
                v.size === size && (
                    (v.color && color && v.color.toLowerCase() === color.toLowerCase()) ||
                    (v.color_name && color && v.color_name.toLowerCase() === color.toLowerCase())
                )
            ) || product.variants?.[0];

            const variantId = matchedVariant?.id || product.id;

            return [...prev, {
                key,
                id: product.id,
                variantId: variantId,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.url || '',
                size,
                color,
                quantity,
            }];
        });
        showToast(`${product.name} añadido al carrito`);
    }, [showToast]);

    const removeItem = useCallback((key) => {
        setItems(prev => prev.filter(item => item.key !== key));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        localStorage.removeItem('zzaly_cart');
    }, []);

    const updateQuantity = useCallback((key, quantity) => {
        if (quantity < 1) return;
        setItems(prev =>
            prev.map(item =>
                item.key === key ? { ...item, quantity } : item
            )
        );
    }, []);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            clearCart,
            updateQuantity,
            totalItems,
            totalPrice,
            toast,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
