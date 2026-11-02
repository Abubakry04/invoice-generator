import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductItem } from '../types';
import { SAMPLE_PRODUCTS } from './sampleData';

interface ProductState {
  products: ProductItem[];
  addProduct: (product: Omit<ProductItem, 'id' | 'createdAt'>) => ProductItem;
  updateProduct: (id: string, updates: Partial<Omit<ProductItem, 'id' | 'createdAt'>>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  setStock: (id: string, stock: number) => void;
  deductStockForInvoice: (items: { productId?: string; quantity: number }[]) => number;
  restoreStockForInvoice: (items: { productId?: string; quantity: number }[]) => number;
  resetProducts: () => void;
  clearProducts: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: SAMPLE_PRODUCTS,

      addProduct: (data) => {
        const newProduct: ProductItem = {
          ...data,
          id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ products: [newProduct, ...state.products] }));
        return newProduct;
      },

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      adjustStock: (id, delta) =>
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id || p.type !== 'product') return p;
            const currentStock = p.stock ?? 0;
            const newStock = Math.max(0, currentStock + delta);
            return { ...p, stock: newStock };
          }),
        })),

      setStock: (id, stock) =>
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id || p.type !== 'product') return p;
            return { ...p, stock: Math.max(0, stock) };
          }),
        })),

      deductStockForInvoice: (items) => {
        let deductedUnits = 0;
        set((state) => ({
          products: state.products.map((p) => {
            if (p.type !== 'product') return p;
            const matched = items.find((i) => i.productId === p.id);
            if (matched && matched.quantity > 0) {
              const currentStock = p.stock ?? 0;
              const deductAmount = Math.min(currentStock, matched.quantity);
              deductedUnits += deductAmount;
              return { ...p, stock: Math.max(0, currentStock - matched.quantity) };
            }
            return p;
          }),
        }));
        return deductedUnits;
      },

      restoreStockForInvoice: (items) => {
        let restoredUnits = 0;
        set((state) => ({
          products: state.products.map((p) => {
            if (p.type !== 'product') return p;
            const matched = items.find((i) => i.productId === p.id);
            if (matched && matched.quantity > 0) {
              restoredUnits += matched.quantity;
              return { ...p, stock: (p.stock ?? 0) + matched.quantity };
            }
            return p;
          }),
        }));
        return restoredUnits;
      },

      resetProducts: () => set({ products: SAMPLE_PRODUCTS }),

      clearProducts: () => set({ products: [] }),
    }),
    {
      name: 'Egolepay-products',
    }
  )
);
