import axios from 'axios';

// ⚠️ เปลี่ยน IP เป็น IPv4 ของเครื่องคุณ (ดูจาก ipconfig)
// ห้ามใช้ localhost เพราะมือถือ/Emulator จะมองไม่เห็น
const API_URL = 'http://172.16.22.124/medihack_api'; 

// ฟังก์ชันนี้ ใครๆ ก็เรียกใช้ได้ (หมอ, พยาบาล, คนไข้)
export const getPatientInfo = async (an: string) => {
  try {
    console.log(`📡 Fetching data for AN: ${an}...`);
    const response = await axios.get(`${API_URL}/get_patient_info.php`, {
      params: { an: an } // ส่งค่า an ไปให้ PHP
    });
    
    // เช็คว่าได้ข้อมูลมาจริงไหม
    if (response.data && !response.data.error) {
       console.log("✅ Data received!");
       return response.data;
    } else {
       console.warn("⚠️ API returned error or empty");
       return null;
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
};

// ฟังก์ชันสำหรับดึงรายชื่อ AN ทั้งหมด (สำหรับหน้า Dashboard หมอ)
export const getPatientList = async () => {
  try {
    const response = await axios.get(`${API_URL}/get_patient_list.php`);
    return response.data.data; // จะได้ Array เช่น ["AN1", "AN2", ..., "AN10"]
  } catch (error) {
    console.error('❌ Error fetching patient list:', error);
    return [];
  }
};