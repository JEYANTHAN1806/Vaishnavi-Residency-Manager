export const getToken = () => localStorage.getItem("vr_token");
export const setToken = (t: string) => localStorage.setItem("vr_token", t);
export const clearAuth = () => {
  localStorage.removeItem("vr_token");
  localStorage.removeItem("vr_user");
};
