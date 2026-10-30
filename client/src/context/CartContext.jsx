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

    const addItem = useCallback((product, size, color, quantity = 1, variantId = null, stock = null) => {
        // Soporte si se pasan argumentos nombrados en un objeto o posicionales
        let prod = product;
        let pSize = size;
        let pColor = color;
        let pQty = quantity;
        let pVariantId = variantId;
        let pStock = stock;

        if (product && typeof product === 'object' && !size && product.product) {
            prod = product.product;
            pSize = product.size;
            pColor = product.color;
            pQty = product.quantity || 1;
            pVariantId = product.variantId || null;
            pStock = product.stock ?? null;
        }

        setItems(prev => {
            const key = pVariantId ? `var-${pVariantId}` : `${prod.id}-${pSize}-${pColor}`;
            const existing = prev.find(item => item.key === key);
            const itemStock = (pStock !== null && pStock !== undefined)
                ? Number(pStock)
                : (existing?.stock ?? (prod.stock !== undefined ? Number(prod.stock) : null));

            let finalQty = (existing ? existing.quantity : 0) + Number(pQty || 1);
            if (finalQty < 1) finalQty = 1;
            if (itemStock !== null && !isNaN(itemStock) && itemStock > 0) {
                if (finalQty > itemStock) {
                    finalQty = itemStock;
                }
            }

            if (existing) {
                return prev.map(item =>
                    item.key === key
                        ? { ...item, quantity: finalQty, stock: itemStock, variantId: pVariantId || item.variantId }
                        : item
                );
            }

            return [...prev, {
                key,
                id: prod.id,
                variantId: pVariantId || prod.variantId || null,
                stock: itemStock,
                name: prod.name,
                price: Number(prod.price),
                image: prod.images?.[0]?.url || prod.image || '',
                size: pSize,
                color: pColor,
                quantity: finalQty,
            }];
        });
        showToast(`${prod.name} añadido al carrito`);
    }, [showToast]);

    const removeItem = useCallback((key) => {
        setItems(prev => prev.filter(item => item.key !== key));
    }, []);

    const updateQuantity = useCallback((key, quantity) => {
        setItems(prev =>
            prev.map(item => {
                if (item.key !== key) return item;
                let targetQty = Number(quantity);
                if (isNaN(targetQty) || targetQty < 1) {
                    targetQty = 1;
                }
                if (item.stock !== null && item.stock !== undefined && !isNaN(item.stock) && item.stock > 0) {
                    if (targetQty > item.stock) {
                        targetQty = item.stock;
                    }
                }
                return { ...item, quantity: targetQty };
            })
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        try {
            localStorage.removeItem('zzaly_cart');
        } catch (e) {
            console.error('Error clearing cart', e);
        }
    }, []);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
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
