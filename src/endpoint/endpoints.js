const BASE_URL = 'https://apineeyrdirectory.fothubtv.com/api'; 

// --------------------------------------------------------
// API ENDPOINTS (Matching Postman Collection)
// --------------------------------------------------------
export default ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/login/`,   
  REGISTER: `${BASE_URL}/register/`,

  // Regions
  REGION_LIST: `${BASE_URL}/regions/`,
  REGION_CREATE: `${BASE_URL}/regions/create/`,
  REGION_DETAIL: (id) => `${BASE_URL}/regions/${id}/`,
  REGION_UPDATE: (id) => `${BASE_URL}/regions/${id}/update/`,
  REGION_DELETE: (id) => `${BASE_URL}/regions/${id}/delete/`,

  // Cities
  CITY_LIST: `${BASE_URL}/cities/`,
  CITY_CREATE: `${BASE_URL}/cities/create/`,
  CITY_DETAIL: (id) => `${BASE_URL}/cities/${id}/`,
  CITY_UPDATE: (id) => `${BASE_URL}/cities/${id}/update/`,
  CITY_DELETE: (id) => `${BASE_URL}/cities/${id}/delete/`,

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
  PROFILE: `${BASE_URL}/profile/`,
  PROFILE_CREATE: `${BASE_URL}/profile/create/`,
  PROFILE_UPDATE: `${BASE_URL}/profile/update/`,

  // Payments & Subscriptions
  PAYMENT_INITIATE: `${BASE_URL}/api/payments/initiate/`,
  PAYMENT_TRANSACTIONS: `${BASE_URL}/api/payments/transactions/`,
  PAYMENT_CHECK_STATUS: (orderId) => `${BASE_URL}/api/payments/check-status/${orderId}/`,
  SUBSCRIPTION_HISTORY: `${BASE_URL}/api/subscriptions/history/`,
  WEBHOOK_MMPAY: `${BASE_URL}/api/webhooks/mmpay/`,
};

