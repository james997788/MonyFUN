document.addEventListener('DOMContentLoaded', () => {
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const currentStatusSpan = document.getElementById('currentStatus');
    const currentTimeSpan = document.getElementById('currentTime');
    const attendanceList = document.getElementById('attendanceList');
    const notificationsDiv = document.getElementById('notifications');

    // Define standard work times (adjust as needed)
    const DAILY_CHECK_IN_TIME = { hours: 9, minutes: 0 }; // 9:00 AM
    const DAILY_CHECK_OUT_TIME = { hours: 17, minutes: 0 }; // 5:00 PM

    // Load attendance data from Local Storage
    let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

    // Function to display current time
    function updateCurrentTime() {
        const now = new Date();
        currentTimeSpan.textContent = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Update time every second
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime(); // Call immediately to display on load

    // Function to display notifications
    function showNotification(message, type = 'error') {
        notificationsDiv.textContent = message;
        notificationsDiv.className = `notifications show ${type}`;
        setTimeout(() => {
            notificationsDiv.classList.remove('show');
        }, 5000); // Notification disappears after 5 seconds
    }

    // Function to render attendance records
    function renderAttendanceRecords() {
        attendanceList.innerHTML = '';
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter records for the current month to calculate lateness
        const currentMonthRecords = attendanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });

        let lateCountThisMonth = 0;
        currentMonthRecords.forEach(record => {
            if (record.status === 'สาย') {
                lateCountThisMonth++;
            }
        });

        // Check for late warnings
        if (lateCountThisMonth > 3) {
            showNotification(`คุณมาสาย ${lateCountThisMonth} ครั้งในเดือนนี้! กรุณาปรับปรุงการมาทำงานให้ตรงเวลา`, 'warning');
        }

        // Display all records
        attendanceRecords.forEach((record, index) => {
            const listItem = document.createElement('li');
            let statusClass = '';
            if (record.status === 'สาย') {
                statusClass = 'late';
            } else if (record.status === 'ขาดงาน') { // This status is added by the daily check
                statusClass = 'absent';
            }

            listItem.className = statusClass;
            listItem.innerHTML = `
                <span>วันที่: ${record.date}</span>
                <span>เช็คอิน: ${record.checkInTime || 'N/A'}</span>
                <span>เช็คเอาท์: ${record.checkOutTime || 'N/A'}</span>
                <span>สถานะ: ${record.status}</span>
            `;
            attendanceList.prepend(listItem); // Add new records at the top
        });
    }

    // Function to save attendance data to Local Storage
    function saveAttendanceRecords() {
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    }

    // Check-in logic
    checkInBtn.addEventListener('click', () => {
        const now = new Date();
        const todayDate = now.toLocaleDateString('th-TH');
        const checkInTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Check if already checked in today
        const existingRecordIndex = attendanceRecords.findIndex(record => record.date === todayDate);

        if (existingRecordIndex !== -1 && attendanceRecords[existingRecordIndex].checkInTime) {
            showNotification('คุณได้เช็คอินไปแล้ววันนี้!');
            return;
        }

        let status = 'ตรงเวลา';
        // Check for lateness
        const checkInHour = now.getHours();
        const checkInMinute = now.getMinutes();

        if (checkInHour > DAILY_CHECK_IN_TIME.hours || (checkInHour === DAILY_CHECK_IN_TIME.hours && checkInMinute > DAILY_CHECK_IN_TIME.minutes)) {
            status = 'สาย';
            showNotification('คุณเช็คอินสาย!', 'warning');
        } else {
            showNotification('เช็คอินเรียบร้อย!', 'success');
        }

        const newRecord = {
            date: todayDate,
            checkInTime: checkInTime,
            checkOutTime: null,
            status: status
        };

        if (existingRecordIndex !== -1) {
            // Update existing record if it was marked as absent
            attendanceRecords[existingRecordIndex] = { ...attendanceRecords[existingRecordIndex], ...newRecord };
        } else {
            attendanceRecords.push(newRecord);
        }

        saveAttendanceRecords();
        renderAttendanceRecords();
        currentStatusSpan.textContent = `เช็คอิน (${checkInTime})`;
    });

    // Check-out logic
    checkOutBtn.addEventListener('click', () => {
        const now = new Date();
        const todayDate = now.toLocaleDateString('th-TH');
        const checkOutTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const recordIndex = attendanceRecords.findIndex(record => record.date === todayDate);

        if (recordIndex === -1 || !attendanceRecords[recordIndex].checkInTime) {
            showNotification('กรุณาเช็คอินก่อน!');
            return;
        }
        if (attendanceRecords[recordIndex].checkOutTime) {
            showNotification('คุณได้เช็คเอาท์ไปแล้ววันนี้!');
            return;
        }

        attendanceRecords[recordIndex].checkOutTime = checkOutTime;
        saveAttendanceRecords();
        renderAttendanceRecords();
        currentStatusSpan.textContent = `เช็คเอาท์ (${checkOutTime})`;
        showNotification('เช็คเอาท์เรียบร้อย!', 'success');

        // Task completion reminder
        const checkOutHour = now.getHours();
        const checkOutMinute = now.getMinutes();
        if (checkOutHour < DAILY_CHECK_OUT_TIME.hours || (checkOutHour === DAILY_CHECK_OUT_TIME.hours && checkOutMinute < DAILY_CHECK_OUT_TIME.minutes)) {
             showNotification('อย่าลืมเคลียร์งานให้เสร็จก่อนเลิกงาน!', 'warning');
        }
    });

    // Function to handle daily checks (e.g., mark absent if no check-in)
    function dailyAttendanceCheck() {
        const now = new Date();
        const todayDate = now.toLocaleDateString('th-TH');

        // Get the last record for today
        const todayRecord = attendanceRecords.find(record => record.date === todayDate);

        // If today's record doesn't exist, it means they didn't check in
        if (!todayRecord) {
            // Only add if it's past the check-in time and no record exists
            if (now.getHours() > DAILY_CHECK_IN_TIME.hours || (now.getHours() === DAILY_CHECK_IN_TIME.hours && now.getMinutes() > DAILY_CHECK_IN_TIME.minutes)) {
                attendanceRecords.push({
                    date: todayDate,
                    checkInTime: null,
                    checkOutTime: null,
                    status: 'ขาดงาน'
                });
                saveAttendanceRecords();
                renderAttendanceRecords();
            }
        }
    }

    // Initial render and daily check when the page loads
    renderAttendanceRecords();
    dailyAttendanceCheck();

    // Set a daily interval to check for absent employees (e.g., at the end of the day or midnight)
    // For simplicity, we can run this periodically or when the page loads.
    // A more robust solution for a real app would involve server-side checks or more complex scheduling.
    // For a local storage app, we'll run it on page load and you might instruct users to open the app once a day.
});