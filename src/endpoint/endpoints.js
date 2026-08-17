const BASE_URL = 'https://apineeyrdirectory.fothubtv.com/api'; 

// --------------------------------------------------------
// API ENDPOINTS (Matching Postman Collection)
// --------------------------------------------------------
const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/login/`,   
  REGISTER: `${BASE_URL}/register/`,

  // Users
  USER_LIST: `${BASE_URL}/api/users/`,
  USER_DETAIL: (id) => `${BASE_URL}/api/users/${id}/`,
  USER_UPDATE: (id) => `${BASE_URL}/api/users/${id}/update/`,
  USER_DELETE: (id) => `${BASE_URL}/api/users/${id}/delete/`,

  CATEGORIES: `${BASE_URL}/categories/`,

  // Regions & Cities
  REGIONS: `${BASE_URL}/regions/`,
  REGION_DETAIL: (id) => `${BASE_URL}/regions/${id}/`,
  CITIES: `${BASE_URL}/cities/`,

  // Business Brands, Branches, Images & Social Links
  BUSINESS_BRANDS: `${BASE_URL}/business-brands/`,
  BUSINESS_BRAND_CREATE: `${BASE_URL}/business-brands/create/`,
  BRANCHES: `${BASE_URL}/branches/`,
  BRANCH_CREATE: `${BASE_URL}/branches/create/`,
  BRANCH_IMAGES: `${BASE_URL}/branch-images/`,
  BRANCH_SOCIAL_LINKS: `${BASE_URL}/branch-social-links/`,
  BRANCH_SOCIAL_LINK_CREATE: `${BASE_URL}/branch-social-links/create/`,
  BRANCH_SOCIAL_LINK_DETAIL: (id) => `${BASE_URL}/branch-social-links/${id}/`,
  BRANCH_SOCIAL_LINK_UPDATE: (id) => `${BASE_URL}/branch-social-links/${id}/update/`,
  BRANCH_SOCIAL_LINK_DELETE: (id) => `${BASE_URL}/branch-social-links/${id}/delete/`,
  BRANCH_DETAIL: (id) => `${BASE_URL}/branches/${id}/`,
  BRANCH_REVIEWS: `${BASE_URL}/branch-reviews/`,
  BRANCH_REVIEW_CREATE: `${BASE_URL}/branch-reviews/create/`,
  BRANCH_REVIEW_UPDATE: (id) => `${BASE_URL}/branch-reviews/${id}/update/`,
  BRANCH_REVIEW_DELETE: (id) => `${BASE_URL}/branch-reviews/${id}/delete/`,
  BRANCH_VIEW_LOGS_CREATE: `${BASE_URL}/branch-view-logs/create/`,

  // Promotion banners
  BANNERS: `${BASE_URL}/banners/`,
  PROMOTION_BANNERS: `${BASE_URL}/promotion-banners/`,

  // User Favorites
  USER_FAVORITES: `${BASE_URL}/user-favorites/`,
  USER_FAVORITE_CREATE: `${BASE_URL}/user-favorites/create/`,
  USER_FAVORITE_DETAIL: (id) => `${BASE_URL}/user-favorites/${id}/`,
  USER_FAVORITE_DELETE: (id) => `${BASE_URL}/user-favorites/${id}/delete/`,
  USER_FAVORITE_CHECK: (branchId) => `${BASE_URL}/user-favorites/check/?branch_id=${branchId}`,

  // Groups
  GROUP_LIST: `${BASE_URL}/api/groups/`,
  GROUP_CREATE: `${BASE_URL}/api/groups/create/`,
  GROUP_DETAIL: (id) => `${BASE_URL}/api/groups/${id}/`,
  GROUP_UPDATE: (id) => `${BASE_URL}/api/groups/${id}/update/`,
  GROUP_DELETE: (id) => `${BASE_URL}/api/groups/${id}/delete/`,

  // Permissionsn
  PERMISSION_LIST: `${BASE_URL}/api/permissions/`,
  PERMISSION_DETAIL: (id) => `${BASE_URL}/api/permissions/${id}/`,

  // Plans
  PLAN_LIST: `${BASE_URL}/plans/`,
  PLAN_CREATE: `${BASE_URL}/plans/create/`,
  PLAN_DETAIL: (id) => `${BASE_URL}/plans/${id}/`,
  PLAN_UPDATE: (id) => `${BASE_URL}/plans/${id}/update/`,
  PLAN_DELETE: (id) => `${BASE_URL}/plans/${id}/delete/`,

  // Owner & Profile
  OWNER_LIST: `${BASE_URL}/owners/`,                  
  OWNER_DETAIL: (id = '') => `${BASE_URL}/owners/${id ? id + '/' : ''}`, 
  OWNER_UPDATE: (id = '') => `${BASE_URL}/owners/${id ? id + '/update/' : 'update/'}`,
  OWNER_DELETE: (id) => `${BASE_URL}/owners/${id}/delete/`,
  PROFILE: `${BASE_URL}/profile/`,
  PROFILE_CREATE: `${BASE_URL}/profile/create/`,
  PROFILE_UPDATE: `${BASE_URL}/profile/update/`,

  // Payments & Subscriptions
  PAYMENT_INITIATE: `${BASE_URL}/payments/initiate/`,
  PAYMENT_TRANSACTIONS: `${BASE_URL}/payments/transactions/`,
  PAYMENT_CHECK_STATUS: (orderId) => `${BASE_URL}/payments/check-status/${orderId}/`,
  SUBSCRIPTION_HISTORY: `${BASE_URL}/payments/subscription-histories/`,
  WEBHOOK_MMPAY: `${BASE_URL}/webhooks/mmpay/`,
};

export default ENDPOINTS;

