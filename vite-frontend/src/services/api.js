import axios from 'axios';

// ============================================================================
// 1. API INSTANCE SETUP
// ============================================================================
const API = axios.create({
  baseURL: 'http://localhost:3001/api', // Your backend server URL
});

// Interceptor to add the auth token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});


// ============================================================================
// 2. AUTHENTICATION API CALLS
// ============================================================================
export const loginUser = (userData) => API.post('/auth/login', userData);
export const signupCustomer = (customerData) => API.post('/auth/signup/customer', customerData);
export const signupDoctor = (doctorData) => API.post('/auth/signup/doctor', doctorData);


// ============================================================================
// 3. CUSTOMER API CALLS
// ============================================================================
export const getCustomerProfile = () => API.get('/customer/profile');
export const getAllDoctors = () => API.get('/customer/doctors');

// Corrected route for getting prescriptions for the logged-in customer
export const getCustomerPrescriptions = () => API.get('/medical/customer-prescriptions');

// Corrected route for getting reports for the logged-in customer
export const getCustomerReports = () => API.get('/medical/customer-reports');


// ============================================================================
// 4. DOCTOR API CALLS
// ============================================================================
export const getDoctorProfile = () => API.get('/doctor/profile');
export const findCustomerByMedId = (medId) => API.get(`/doctor/customer/${medId}`);


// ============================================================================
// 5. APPOINTMENT API CALLS
// ============================================================================
export const requestAppointment = (appointmentData) => API.post('/appointments', appointmentData);
export const getDoctorAppointments = () => API.get('/appointments/doctor');
export const updateAppointmentStatus = (appointmentId, status) => API.put(`/appointments/${appointmentId}/status`, { status });


// ============================================================================
// 6. MEDICAL (PRESCRIPTIONS & REPORTS) API CALLS
// ============================================================================
export const createPrescription = (prescriptionData) => API.post('/medical/prescriptions', prescriptionData);
export const getPrescriptionsByMedId = (medId) => API.get(`/medical/prescriptions/${medId}`);

export const createReport = (reportData) => API.post('/medical/reports', reportData);
export const getReportsByMedId = (medId) => API.get(`/medical/reports/${medId}`);

