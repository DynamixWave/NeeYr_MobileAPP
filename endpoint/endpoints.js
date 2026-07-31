export const BASE_URL = 'https://apineeyrdirectory.fothubtv.com'; 

// --------------------------------------------------------
// API ENDPOINTS (Matching Postman Collection)
// --------------------------------------------------------
export const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/api/login/`,   
  REGISTER: `${BASE_URL}/api/register/`,

  // Users
  USER_LIST: `${BASE_URL}/api/users/`,
  USER_DETAIL: (id) => `${BASE_URL}/api/users/${id}/`,
  USER_UPDATE: (id) => `${BASE_URL}/api/users/${id}/update/`,
  USER_DELETE: (id) => `${BASE_URL}/api/users/${id}/delete/`,

  // Groups
  GROUP_LIST: `${BASE_URL}/api/groups/`,
  GROUP_CREATE: `${BASE_URL}/api/groups/create/`,
  GROUP_DETAIL: (id) => `${BASE_URL}/api/groups/${id}/`,
  GROUP_UPDATE: (id) => `${BASE_URL}/api/groups/${id}/update/`,
  GROUP_DELETE: (id) => `${BASE_URL}/api/groups/${id}/delete/`,

  // Permissions
  PERMISSION_LIST: `${BASE_URL}/api/permissions/`,
  PERMISSION_DETAIL: (id) => `${BASE_URL}/api/permissions/${id}/`,

  // Plans
  PLAN_LIST: `${BASE_URL}/api/plans/`,
  PLAN_CREATE: `${BASE_URL}/api/plans/create/`,
  PLAN_DETAIL: (id) => `${BASE_URL}/api/plans/${id}/`,
  PLAN_UPDATE: (id) => `${BASE_URL}/api/plans/${id}/update/`,
  PLAN_DELETE: (id) => `${BASE_URL}/api/plans/${id}/delete/`,

  // Owner & Profile
  OWNER_LIST: `${BASE_URL}/api/owners/`,                  
  OWNER_DETAIL: (id = '') => `${BASE_URL}/api/owners/${id ? id + '/' : ''}`, 
  OWNER_UPDATE: (id = '') => `${BASE_URL}/api/owners/${id ? id + '/update/' : 'update/'}`,
  OWNER_DELETE: (id) => `${BASE_URL}/api/owners/${id}/delete/`,
  PROFILE: `${BASE_URL}/api/profile/`,
  PROFILE_CREATE: `${BASE_URL}/api/profile/create/`,
  PROFILE_UPDATE: `${BASE_URL}/api/profile/update/`,

  // Payments & Subscriptions
  PAYMENT_INITIATE: `${BASE_URL}/api/payments/initiate/`,
  PAYMENT_TRANSACTIONS: `${BASE_URL}/api/payments/transactions/`,
  PAYMENT_CHECK_STATUS: (orderId) => `${BASE_URL}/api/payments/check-status/${orderId}/`,
  SUBSCRIPTION_HISTORY: `${BASE_URL}/api/subscriptions/history/`,
  WEBHOOK_MMPAY: `${BASE_URL}/api/webhooks/mmpay/`,
};

export default ENDPOINTS;