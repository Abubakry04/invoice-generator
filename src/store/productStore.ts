import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductItem } from '../types';
import { SAMPLE_PRODUCTS } from './sampleData';
import { useBusinessStore } from './businessStore';

interface ProductState {
  products: ProductItem[];

  // Actions
  addProduct: (product: Omit<ProductItem, 'id' | 'createdAt'>) => ProductItem;
  updateProduct: (id: string, updates: Partial<Omit<ProductItem, 'id' | 'createdAt'>>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => ProductItem | undefined;
  getProductsByBusiness: (businessId?: string) => ProductItem[];
  adjustStock: (id: string, delta: number) => void;
  setStock: (id: string, stock: number) => void;
  deductStockForInvoice: (items: { productId?: string; quantity: number }[]) => number;
  restoreStockForInvoice: (items: { productId?: string; quantity: number }[]) => number;
  resetProducts: () => void;
  clearProducts: () => void;
}

const INITIAL_PRODUCTS: ProductItem[] = SAMPLE_PRODUCTS.map((p) => ({
  ...p,
  businessId: 'biz-default-01',
  taxRate: 7.5,
}));

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,

      addProduct: (data) => {
        const activeBizId = useBusinessStore.getState().activeBusinessId || 'biz-default-01';
        const newProduct: ProductItem = {
          ...data,
          id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          businessId: data.businessId || activeBizId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ products: [newProduct, ...state.products] }));
        return newProduct;
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      getProduct: (id) => get().products.find((p) => p.id === id),

      getProductsByBusiness: (businessId) => {
        const targetBiz = businessId || useBusinessStore.getState().activeBusinessId;
        return get().products.filter((p) => p.businessId === targetBiz);
      },

      adjustStock: (id, delta) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id || p.type !== 'product') return p;
            const currentStock = p.stock ?? 0;
            const newStock = Math.max(0, currentStock + delta);
            return { ...p, stock: newStock };
          }),
        }));
      },

      setStock: (id, stock) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id || p.type !== 'product') return p;
            return { ...p, stock: Math.max(0, stock) };
          }),
        }));
      },

      deductStockForInvoice: (items) => {
        let totalDeducted = 0;
        set((state) => {
          const updated = state.products.map((product) => {
            if (product.type !== 'product') return product;
            const matchingItem = items.find((i) => i.productId === product.id);
            if (matchingItem && matchingItem.quantity > 0) {
              const currentStock = product.stock ?? 0;
              const newStock = Math.max(0, currentStock - matchingItem.quantity);
              totalDeducted += matchingItem.quantity;
              return { ...product, stock: newStock };
            }
            return product;
          });
          return { products: updated };
        });
        return totalDeducted;
      },

      restoreStockForInvoice: (items) => {
        let totalRestored = 0;
        set((state) => {
          const updated = state.products.map((product) => {
            if (product.type !== 'product') return product;
            const matchingItem = items.find((i) => i.productId === product.id);
            if (matchingItem && matchingItem.quantity > 0) {
              const currentStock = product.stock ?? 0;
              const newStock = currentStock + matchingItem.quantity;
              totalRestored += matchingItem.quantity;
              return { ...product, stock: newStock };
            }
            return product;
          });
          return { products: updated };
        });
        return totalRestored;
      },

      resetProducts: () => set({ products: INITIAL_PRODUCTS }),

      clearProducts: () => set({ products: [] }),
    }),
    {
      name: 'egolepay-products',
    }
  )
);
