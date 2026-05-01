import axios from 'axios';
import { CSRF_HEADER_NAME, CSRF_COOKIE_NAME, getCookieFromDocument, isStateChangingMethod } from './csrf';
import logger from './logger';

const api = axios.create({
  // Use relative URL — Next.js rewrites proxy this to localhost:5000 server-side.
  // Works both locally and via Cloudflare tunnel without exposing backend port.
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true, // Send httpOnly cookies on every request
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (isStateChangingMethod(method)) {
    const token = getCookieFromDocument(CSRF_COOKIE_NAME);
    if (token) {
      config.headers = config.headers || {};
      config.headers[CSRF_HEADER_NAME] = token;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;

    if (typeof window !== 'undefined') {
      logger.error('[API request failed]', {
        method: err.config?.method?.toUpperCase(),
        url: err.config?.url,
        status: err.response?.status,
        data,
      });
    }

    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const authPaths = ['/login', '/register'];
      if (!authPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    // Always normalize to a plain object with an `error` string.
    // Prevents React error #31 ("Objects are not valid as a React child")
    // when backend returns {code, message} without an 'error' key.
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
export const createPaytmPayment = (data) => api.post('/payments/paytm/create', data);

// ─── Coupon ───────────────────────────────────────────────────────────────────
export const applyCoupon = (data) => api.post('/apply-coupon', data);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const submitReview = (data) => api.post('/reviews', data);

// ─── Fragrance Finder ────────────────────────────────────────────────────────
export const submitFragranceFinder = (data) => api.post('/fragrance-finder', data);

// ─── Contact ────────────────────────────────────────────────────────────────
export const submitContactMessage = (data) => api.post('/contact', data);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetProducts = () => api.get('/admin/products');
export const adminGetProduct = (id) => api.get(`/admin/products/${id}`);
export const adminCreateProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const adminDeleteProductImage = (productId, imageId) => api.delete(`/admin/products/${productId}/images/${imageId}`);

export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminGetOrder = (id) => api.get(`/admin/orders/${id}`);
export const adminUpdateOrder = (id, data) => api.put(`/admin/orders/${id}`, data);
export const adminRefundOrder = (id, data = {}) => api.post(`/admin/orders/${id}/refund`, data);

export const adminGetUsers = (params) => api.get('/admin/users', { params });
export const adminToggleBlock = (id) => api.put(`/admin/users/${id}/toggle-block`);

export const adminGetReviews = (params) => api.get('/admin/reviews', { params });
export const adminApproveReview = (id) => api.put(`/admin/reviews/${id}/approve`);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`);

export const adminGetCoupons = () => api.get('/admin/coupons');
export const adminCreateCoupon = (data) => api.post('/admin/coupons', data);
export const adminUpdateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

export const adminGetFragranceFinder = (params) => api.get('/admin/fragrance-finder', { params });
export const adminGetContactMessages = (params) => api.get('/admin/contact-submissions', { params });

export const adminGetTestimonials = () => api.get('/admin/testimonials');
export const adminCreateTestimonial = (data) => api.post('/admin/testimonials', data);
export const adminUpdateTestimonial = (id, data) => api.patch(`/admin/testimonials/${id}`, data);
export const adminDeleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}`);

export const adminGetAnalytics = (params) => api.get('/admin/analytics', { params });
export const adminGetMetrics = () => api.get('/admin/metrics');
export const adminGetPerf = () => api.get('/perf');
export const adminGetAudit = (params) => api.get('/admin/audit', { params });
export const adminGetWebhookDlq = (params) => api.get('/admin/webhooks/dlq', { params });
export const adminRetryWebhook = (id) => api.post(`/admin/webhooks/dlq/${id}/retry`);

export default api;
