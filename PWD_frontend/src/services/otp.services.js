import axios from "axios"

const API_URL = "http://localhost:5000/api/otp"

export const sendOtp = (email) => {
  return axios.post(`${API_URL}/send`, { email })
}

export const verifyOtp = (email, otp) => {
  return axios.post(`${API_URL}/verify`, { email, otp })
}
