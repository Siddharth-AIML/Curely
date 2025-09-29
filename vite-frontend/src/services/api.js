import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- AUTH ---
export const loginUser = (userData) => API.post('/auth/login', userData);
export const signupCustomer = (customerData) => API.post('/auth/signup/customer', customerData);
export const signupDoctor = (doctorData) => API.post('/auth/signup/doctor', doctorData);

// --- CUSTOMER ---
export const getCustomerProfile = () => API.get('/customer/profile');
export const getAllDoctors = () => API.get('/customer/doctors');
export const getCustomerPrescriptions = () => API.get('/medical/customer-prescriptions');
export const getCustomerReports = () => API.get('/medical/customer-reports');
export const getCustomerAppointments = () => API.get('/appointments/customer');
export const updateCustomerPassword = (passwordData) => API.put('/customer/password', passwordData);

// --- DOCTOR ---
export const getDoctorProfile = () => API.get('/doctor/profile');
export const findCustomerByMedId = (medId) => API.get(`/doctor/customer/${medId}`);
export const updateDoctorPassword = (passwordData) => API.put('/doctor/password', passwordData);

// --- APPOINTMENTS ---
export const requestAppointment = (appointmentData) => API.post('/appointments', appointmentData);
export const getDoctorAppointments = () => API.get('/appointments/doctor');
export const updateAppointmentStatus = (appointmentId, status) => API.put(`/appointments/${appointmentId}/status`, { status });

// --- MEDICAL ---
export const createPrescription = (prescriptionData) => API.post('/medical/prescriptions', prescriptionData);
export const getPrescriptionsByMedId = (medId) => API.get(`/medical/prescriptions/${medId}`);
export const createReport = (reportData) => API.post('/medical/reports', reportData);
export const getReportsByMedId = (medId) => API.get(`/medical/reports/${medId}`);

