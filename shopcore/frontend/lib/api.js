import axios from 'axios';

const api = axios.create({
  // Use relative URL — Next.js rewrites proxy this to localhost:5000 server-side.
  // Works both locally and via Cloudflare tunnel without exposing backend port.
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true, // Send httpOnly cookies on every request
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const authPaths = ['/login', '/register'];
      if (!authPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    // Always normalize to a plain object with an `error` string.
    // Prevents React error #31 ("Objects are not valid as a React child")
    // when backend returns {code, message} without an 'error' key.
    const data = err.response?.data;
    const normalized = {
      error:
        (typeof data === 'string' ? data : null) ||
        data?.error ||
        data?.message ||
        err.message ||
        'Something went wrong',
      status: err.response?.status,
    };
    return Promise.reject(normalized);
  }
);

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (slug) => api.get(`/products/${slug}`);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// ─── Orders ───────────────────────────────────────────────────────────────────
export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/me');
export const getMyOrder = (id) => api.get(`/orders/me/${id}`);

// ─── Payments ─────────────────────────────────────────────────────────────────
export const createPayment = (data) => api.post('/payments/create', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);

// ─── Coupon ───────────────────────────────────────────────────────────────────
export const applyCoupon = (data) => api.post('/apply-coupon', data);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const submitReview = (data) => api.post('/reviews', data);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetProducts = () => api.get('/admin/products');
export const adminCreateProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const adminDeleteProductImage = (productId, imageId) => api.delete(`/admin/products/${productId}/images/${imageId}`);

export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminGetOrder = (id) => api.get(`/admin/orders/${id}`);
export const adminUpdateOrder = (id, data) => api.put(`/admin/orders/${id}`, data);

export const adminGetUsers = (params) => api.get('/admin/users', { params });
export const adminToggleBlock = (id) => api.put(`/admin/users/${id}/toggle-block`);

export const adminGetReviews = (params) => api.get('/admin/reviews', { params });
export const adminApproveReview = (id) => api.put(`/admin/reviews/${id}/approve`);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`);

export const adminGetCoupons = () => api.get('/admin/coupons');
export const adminCreateCoupon = (data) => api.post('/admin/coupons', data);
export const adminUpdateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

export const adminGetAnalytics = (params) => api.get('/admin/analytics', { params });

export default api;
