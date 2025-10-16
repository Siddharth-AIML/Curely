import axios from 'axios';
const API = axios.create({ 
    baseURL: 'https://curely-backend-api-awaygqhcgthzdnha.southindia-01.azurewebsites.net/api' 
});

// Axios Interceptor to automatically attach the JWT token to every request
API.interceptors.request.use((req) => {
 const token = localStorage.getItem('token');
 if (token) { req.headers.Authorization = `Bearer ${token}`; }
  return req;
});

// --- AUTH ---
export const loginUser = (d) => API.post('/auth/login', d);
export const signupCustomer = (d) => API.post('/auth/signup/customer', d);
export const signupDoctor = (d) => API.post('/auth/signup/doctor', d);
export const signupLab = (d) => API.post('/auth/signup/lab', d); 

// --- CUSTOMER ---
export const getCustomerProfile = () => API.get('/customer/profile');
export const getAllDoctors = () => API.get('/customer/doctors');
export const getCustomerPrescriptions = () => API.get('/medical/customer-prescriptions');
export const getCustomerReports = () => API.get('/reports/customer/my-reports');
export const getCustomerAppointments = () => API.get('/appointments/customer');
export const updateCustomerPassword = (d) => API.put('/customer/password', d);

// --- DOCTOR ---
export const getDoctorProfile = () => API.get('/doctor/profile');
export const findCustomerByMedId = (id) => API.get(`/doctor/customer/${id}`);
export const updateDoctorPassword = (d) => API.put('/doctor/password', d);
export const sendPatientOTP = (medId) => API.post('/doctor/send-patient-otp', { medId });
export const verifyPatientOTP = (medId, otp) => API.post('/doctor/verify-patient-otp', { medId, otp });

// This function fetches the approved labs list for the 'New Lab Test Request' modal.
 export const getApprovedLabs = () => API.get('/lab/approved'); 

// --- APPOINTMENTS ---
export const requestAppointment = (d) => API.post('/appointments', d);
export const getDoctorAppointments = () => API.get('/appointments/doctor');
export const updateAppointmentStatus = (id, s) => API.put(`/appointments/${id}/status`, { status: s });

// --- MEDICAL & REPORTS ---
export const createPrescription = (d) => API.post('/medical/prescriptions', d);
export const getPrescriptionsByMedId = (id) => API.get(`/medical/prescriptions/${id}`);
export const requestLabTest = (d) => API.post('/reports/request', d); // DOCTOR REQUESTS NEW TEST
export const createReport = (d) => API.post('/reports/request', d); // Alias for consistency
export const getReportsByMedId = (id) => API.get(`/reports/doctor/patient/${id}`); // DOCTOR VIEWS PATIENT REPORTS

// --- LAB ROUTES ---
export const getLabProfile = () => API.get('/lab/profile');
export const updateLabProfile = (formData) => API.post('/lab/profile', formData);
export const getLabPendingTests = () => API.get('/reports/lab/pending');
export const getTestDetails = (reportId) => API.get(`/reports/${reportId}`);
export const updateTestStatus = (id, newStatus) => API.put(`/reports/${id}/status`, { newStatus });

// Report Upload (Used by LabReportUpload.jsx)
export const uploadTestReport = (reportId, formData) => API.put(`/reports/upload/${reportId}`, formData, {
 headers: {
 'Content-Type': 'multipart/form-data', // Essential for file uploads
 },
}); 

export default API;