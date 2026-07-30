export const BASE_URL = 'https://apineeyrdirectory.fothubtv.com'; 

// --------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------
export const ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/login/`,   
  REGISTER: `${BASE_URL}/api/register/`,

  // Owner Profiles
  OWNER_LIST: `${BASE_URL}/api/owners/`,                  // GET (Admin)
  OWNER_CREATE: `${BASE_URL}/api/owners/create/`,         // POST 
  OWNER_DETAIL: (id = '') => `${BASE_URL}/api/owners/${id ? id + '/' : ''}`, // GET (Pass ID for admin, empty for own profile)
  OWNER_UPDATE: (id = '') => `${BASE_URL}/api/owners/${id ? id + '/update/' : 'update/'}`, // PUT/PATCH
  OWNER_DELETE: (id) => `${BASE_URL}/api/owners/${id}/delete/`, // DELETE (Admin)
};

export default ENDPOINTS;