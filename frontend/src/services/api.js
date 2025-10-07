import axios from 'axios';

const API = axios.create({ baseURL: 'https://curely.onrender.com/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) { req.headers.Authorization = `Bearer ${token}`; }
  return req;
});

// --- AUTH ---
export const loginUser = (d) => API.post('/auth/login', d);
export const signupCustomer = (d) => API.post('/auth/signup/customer', d);
export const signupDoctor = (d) => API.post('/auth/signup/doctor', d);

// --- CUSTOMER ---
export const getCustomerProfile = () => API.get('/customer/profile');
export const getAllDoctors = () => API.get('/customer/doctors');
export const getCustomerPrescriptions = () => API.get('/medical/customer-prescriptions');
export const getCustomerReports = () => API.get('/medical/customer-reports');
export const getCustomerAppointments = () => API.get('/appointments/customer');
export const updateCustomerPassword = (d) => API.put('/customer/password', d);

// --- DOCTOR ---
export const getDoctorProfile = () => API.get('/doctor/profile');
export const findCustomerByMedId = (id) => API.get(`/doctor/customer/${id}`);
export const updateDoctorPassword = (d) => API.put('/doctor/password', d);
export const sendPatientOTP = (medId) => API.post('/doctor/send-patient-otp', { medId });
export const verifyPatientOTP = (medId, otp) => API.post('/doctor/verify-patient-otp', { medId, otp });

// --- APPOINTMENTS ---
export const requestAppointment = (d) => API.post('/appointments', d);
export const getDoctorAppointments = () => API.get('/appointments/doctor');
export const updateAppointmentStatus = (id, s) => API.put(`/appointments/${id}/status`, { status: s });

// --- MEDICAL ---
export const createPrescription = (d) => API.post('/medical/prescriptions', d);
export const getPrescriptionsByMedId = (id) => API.get(`/medical/prescriptions/${id}`);
export const createReport = (d) => API.post('/medical/reports', d);
export const getReportsByMedId = (id) => API.get(`/medical/reports/${id}`);

