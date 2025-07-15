// --- Data Storage (using Local Storage for simplicity) ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('goals', JSON.stringify(goals));
}

// --- Navigation ---
const navItems = document.querySelectorAll('.nav-menu ul li');
const pages = document.querySelectorAll('.page');
const headerTitle = document.querySelector('header h2');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all nav items and pages
        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active-page'));

        // Add active class to clicked nav item and corresponding page
        item.classList.add('active');
        const pageId = item.dataset.page + '-page';
        document.getElementById(pageId).classList.add('active-page');

        // Update header title
        headerTitle.textContent = item.textContent.trim();

        // Refresh data when switching pages (especially for dashboard)
        if (item.dataset.page === 'dashboard') {
            renderDashboard();
        } else if (item.dataset.page === 'transactions') {
            renderTransactionHistory();
        } else if (item.dataset.page === 'goals') {
            renderGoals();
        }
    });
});

// --- Dashboard Functions ---
function renderDashboard() {
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const currentBalanceEl = document.getElementById('current-balance');
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    const latestGoalDisplay = document.getElementById('latest-goal-display');

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });

    const currentBalance = totalIncome - totalExpense;

    totalIncomeEl.textContent = `${totalIncome.toLocaleString()} ฿`;
    totalExpenseEl.textContent = `${totalExpense.toLocaleString()} ฿`;
    currentBalanceEl.textContent = `${currentBalance.toLocaleString()} ฿`;

    // Render recent transactions (up to 5)
    recentTransactionsList.innerHTML = '';
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedTransactions.slice(0, 5).forEach(t => {
        const li = document.createElement('li');
        const sign = t.type === 'income' ? '+' : '-';
        const typeClass = t.type === 'income' ? 'type-income' : 'type-expense';
        li.innerHTML = `<span class="${typeClass}">${sign} ${t.amount.toLocaleString()} ฿</span> ${t.description} <span class="date">${t.date}</span>`;
        recentTransactionsList.appendChild(li);
    });
    if (sortedTransactions.length === 0) {
        recentTransactionsList.innerHTML = '<li class="text-center" style="color:var(--light-text-color);">ยังไม่มีรายการ</li>';
    }


    // Render latest goal
    if (goals.length > 0) {
        // Sort goals by due date, then by creation date (if no due date)
        const sortedGoals = [...goals].sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return new Date(b.createdAt) - new Date(a.createdAt); // Latest created if no due date
        });
        const latestGoal = sortedGoals[0];
        const progress = (latestGoal.savedAmount / latestGoal.targetAmount) * 100;
        const remaining = latestGoal.targetAmount - latestGoal.savedAmount;

        latestGoalDisplay.innerHTML = `
            <h4>${latestGoal.name}</h4>
            <p>เป้าหมาย: <strong>${latestGoal.targetAmount.toLocaleString()} ฿</strong></p>
            <p>ออมแล้ว: <strong>${latestGoal.savedAmount.toLocaleString()} ฿</strong></p>
            <div class="progress-bar"><div class="progress" style="width: ${Math.min(100, progress)}%;"></div></div>
            <div class="goal-details">
                <span>${progress.toFixed(2)}%</span>
                <span>เหลือ: ${remaining.toLocaleString()} ฿</span>
            </div>
            <div class="goal-actions">
                <button class="btn-primary" onclick="switchPage('goals')">ดูรายละเอียด</button>
            </div>
        `;
        latestGoalDisplay.classList.remove('no-goal');
    } else {
        latestGoalDisplay.innerHTML = `<p>ยังไม่มีเป้าหมาย <button id="add-goal-btn-dashboard" class="btn-primary">เพิ่มเป้าหมาย</button></p>`;
        latestGoalDisplay.classList.add('no-goal');
        document.getElementById('add-goal-btn-dashboard').addEventListener('click', () => switchPage('goals'));
    }
}

// Helper to switch pages programmatically
function switchPage(pageName) {
    navItems.forEach(nav => nav.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active-page'));

    const targetNavItem = document.querySelector(`.nav-menu ul li[data-page="${pageName}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
        document.getElementById(pageName + '-page').classList.add('active-page');
        headerTitle.textContent = targetNavItem.textContent.trim();
        if (pageName === 'goals') renderGoals();
        if (pageName === 'transactions') renderTransactionHistory();
    }
}


// --- Transactions Functions ---
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionTypeInput = document.getElementById('transaction-type');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionDateInput = document.getElementById('transaction-date');
const transactionHistoryList = document.getElementById('transaction-history-list');

// Set current date as default for transaction date input
transactionDateInput.value = new Date().toISOString().split('T')[0];

addTransactionBtn.addEventListener('click', () => {
    const type = transactionTypeInput.value;
    const amount = parseFloat(transactionAmountInput.value);
    const description = transactionDescriptionInput.value.trim();
    const date = transactionDateInput.value;

    if (amount <= 0 || isNaN(amount) || !description || !date) {
        alert('กรุณากรอกข้อมูลรายการให้ครบถ้วนและถูกต้อง (จำนวนเงินต้องมากกว่า 0)');
        return;
    }

    const newTransaction = {
        id: Date.now(), // Unique ID
        type,
        amount,
        description,
        date
    };

    transactions.push(newTransaction);
    saveData();
    renderTransactionHistory();
    renderDashboard(); // Update dashboard after new transaction
    clearTransactionForm();
});

function renderTransactionHistory() {
    transactionHistoryList.innerHTML = '';
    if (transactions.length === 0) {
        transactionHistoryList.innerHTML = '<li class="text-center" style="color:var(--light-text-color);">ยังไม่มีรายการบันทึก</li>';
        return;
    }

    // Sort by date descending
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(t => {
        const li = document.createElement('li');
        const sign = t.type === 'income' ? '+' : '-';
        const typeClass = t.type === 'income' ? 'type-income' : 'type-expense';
        li.innerHTML = `
            <span class="${typeClass}">${sign} ${t.amount.toLocaleString()} ฿</span>
            <span>${t.description}</span>
            <span class="date">${t.date}</span>
            <div>
                <button class="btn-secondary btn-small" onclick="editTransaction(${t.id})">แก้ไข</button>
                <button class="btn-primary btn-small" style="background-color: var(--expense-color);" onclick="deleteTransaction(${t.id})">ลบ</button>
            </div>
        `;
        transactionHistoryList.appendChild(li);
    });
}

function clearTransactionForm() {
    transactionAmountInput.value = '';
    transactionDescriptionInput.value = '';
    transactionTypeInput.value = 'income';
    transactionDateInput.value = new Date().toISOString().split('T')[0]; // Reset to current date
}

function deleteTransaction(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่ต้องการลบรายการนี้?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactionHistory();
        renderDashboard(); // Update dashboard
    }
}

function editTransaction(id) {
    const transactionToEdit = transactions.find(t => t.id === id);
    if (transactionToEdit) {
        transactionTypeInput.value = transactionToEdit.type;
        transactionAmountInput.value = transactionToEdit.amount;
        transactionDescriptionInput.value = transactionToEdit.description;
        transactionDateInput.value = transactionToEdit.date;

        // Change button to update
        addTransactionBtn.textContent = 'อัปเดตรายการ';
        addTransactionBtn.onclick = () => {
            updateTransaction(id);
        };
    }
}

function updateTransaction(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        const type = transactionTypeInput.value;
        const amount = parseFloat(transactionAmountInput.value);
        const description = transactionDescriptionInput.value.trim();
        const date = transactionDateInput.value;

        if (amount <= 0 || isNaN(amount) || !description || !date) {
            alert('กรุณากรอกข้อมูลรายการให้ครบถ้วนและถูกต้อง (จำนวนเงินต้องมากกว่า 0)');
            return;
        }

        transactions[index] = { id, type, amount, description, date };
        saveData();
        renderTransactionHistory();
        renderDashboard(); // Update dashboard

        // Reset button and form
        addTransactionBtn.textContent = 'บันทึกรายการ';
        addTransactionBtn.onclick = () => {
            const type = transactionTypeInput.value;
            const amount = parseFloat(transactionAmountInput.value);
            const description = transactionDescriptionInput.value.trim();
            const date = transactionDateInput.value;

            if (amount <= 0 || isNaN(amount) || !description || !date) {
                alert('กรุณากรอกข้อมูลรายการให้ครบถ้วนและถูกต้อง (จำนวนเงินต้องมากกว่า 0)');
                return;
            }

            const newTransaction = {
                id: Date.now(),
                type,
                amount,
                description,
                date
            };

            transactions.push(newTransaction);
            saveData();
            renderTransactionHistory();
            renderDashboard();
            clearTransactionForm();
        };
        clearTransactionForm();
    }
}


// --- Goals Functions ---
const addGoalBtn = document.getElementById('add-goal-btn');
const goalNameInput = document.getElementById('goal-name');
const goalTargetAmountInput = document.getElementById('goal-target-amount');
const goalSavedAmountInput = document.getElementById('goal-saved-amount');
const goalDueDateInput = document.getElementById('goal-due-date');
const goalsList = document.getElementById('goals-list');

addGoalBtn.addEventListener('click', () => {
    const name = goalNameInput.value.trim();
    const targetAmount = parseFloat(goalTargetAmountInput.value);
    const savedAmount = parseFloat(goalSavedAmountInput.value || 0);
    const dueDate = goalDueDateInput.value;

    if (!name || targetAmount <= 0 || isNaN(targetAmount) || savedAmount < 0 || isNaN(savedAmount)) {
        alert('กรุณากรอกข้อมูลเป้าหมายให้ครบถ้วนและถูกต้อง (จำนวนเงินเป้าหมายต้องมากกว่า 0)');
        return;
    }
    if (savedAmount > targetAmount) {
        alert('จำนวนเงินที่ออมแล้วไม่สามารถมากกว่าจำนวนเงินเป้าหมายได้');
        return;
    }

    const newGoal = {
        id: Date.now(),
        name,
        targetAmount,
        savedAmount,
        dueDate,
        createdAt: new Date().toISOString().split('T')[0] // For sorting if no due date
    };

    goals.push(newGoal);
    saveData();
    renderGoals();
    renderDashboard(); // Update dashboard for latest goal
    clearGoalForm();
});

function renderGoals() {
    goalsList.innerHTML = '';
    if (goals.length === 0) {
        goalsList.innerHTML = '<li class="text-center" style="color:var(--light-text-color);">ยังไม่มีเป้าหมายการออม</li>';
        return;
    }

    goals.forEach(g => {
        const li = document.createElement('li');
        const progress = (g.savedAmount / g.targetAmount) * 100;
        const remaining = g.targetAmount - g.savedAmount;
        const dueDateText = g.dueDate ? `สิ้นสุด: ${g.dueDate}` : 'ไม่มีกำหนด';

        li.innerHTML = `
            <div>
                <h4>${g.name}</h4>
                <p>เป้าหมาย: <strong>${g.targetAmount.toLocaleString()} ฿</strong> | ออมแล้ว: <strong>${g.savedAmount.toLocaleString()} ฿</strong></p>
                <div class="progress-bar"><div class="progress" style="width: ${Math.min(100, progress)}%;"></div></div>
                <div class="goal-details">
                    <span>${progress.toFixed(2)}%</span>
                    <span>เหลือ: ${remaining.toLocaleString()} ฿</span>
                </div>
                <p class="date">${dueDateText}</p>
            </div>
            <div class="goal-actions">
                <button class="btn-secondary btn-small" onclick="addAmountToGoal(${g.id})">เพิ่มเงินออม</button>
                <button class="btn-secondary btn-small" onclick="editGoal(${g.id})">แก้ไข</button>
                <button class="btn-primary btn-small" style="background-color: var(--expense-color);" onclick="deleteGoal(${g.id})">ลบ</button>
            </div>
        `;
        goalsList.appendChild(li);
    });
}

function clearGoalForm() {
    goalNameInput.value = '';
    goalTargetAmountInput.value = '';
    goalSavedAmountInput.value = '0';
    goalDueDateInput.value = '';
    addGoalBtn.textContent = 'เพิ่มเป้าหมาย'; // Reset button text
    addGoalBtn.onclick = () => {
        const name = goalNameInput.value.trim();
        const targetAmount = parseFloat(goalTargetAmountInput.value);
        const savedAmount = parseFloat(goalSavedAmountInput.value || 0);
        const dueDate = goalDueDateInput.value;

        if (!name || targetAmount <= 0 || isNaN(targetAmount) || savedAmount < 0 || isNaN(savedAmount)) {
            alert('กรุณากรอกข้อมูลเป้าหมายให้ครบถ้วนและถูกต้อง (จำนวนเงินเป้าหมายต้องมากกว่า 0)');
            return;
        }
        if (savedAmount > targetAmount) {
            alert('จำนวนเงินที่ออมแล้วไม่สามารถมากกว่าจำนวนเงินเป้าหมายได้');
            return;
        }

        const newGoal = {
            id: Date.now(),
            name,
            targetAmount,
            savedAmount,
            dueDate,
            createdAt: new Date().toISOString().split('T')[0]
        };

        goals.push(newGoal);
        saveData();
        renderGoals();
        renderDashboard();
        clearGoalForm();
    };
}

function deleteGoal(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่ต้องการลบเป้าหมายนี้?')) {
        goals = goals.filter(g => g.id !== id);
        saveData();
        renderGoals();
        renderDashboard(); // Update dashboard
    }
}

function editGoal(id) {
    const goalToEdit = goals.find(g => g.id === id);
    if (goalToEdit) {
        goalNameInput.value = goalToEdit.name;
        goalTargetAmountInput.value = goalToEdit.targetAmount;
        goalSavedAmountInput.value = goalToEdit.savedAmount;
        goalDueDateInput.value = goalToEdit.dueDate;

        addGoalBtn.textContent = 'อัปเดตเป้าหมาย';
        addGoalBtn.onclick = () => {
            updateGoal(id);
        };
    }
}

function updateGoal(id) {
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        const name = goalNameInput.value.trim();
        const targetAmount = parseFloat(goalTargetAmountInput.value);
        const savedAmount = parseFloat(goalSavedAmountInput.value || 0);
        const dueDate = goalDueDateInput.value;

        if (!name || targetAmount <= 0 || isNaN(targetAmount) || savedAmount < 0 || isNaN(savedAmount)) {
            alert('กรุณากรอกข้อมูลเป้าหมายให้ครบถ้วนและถูกต้อง (จำนวนเงินเป้าหมายต้องมากกว่า 0)');
            return;
        }
        if (savedAmount > targetAmount) {
            alert('จำนวนเงินที่ออมแล้วไม่สามารถมากกว่าจำนวนเงินเป้าหมายได้');
            return;
        }

        goals[index] = { ...goals[index], name, targetAmount, savedAmount, dueDate }; // Keep createdAt
        saveData();
        renderGoals();
        renderDashboard();
        clearGoalForm(); // Reset form and button
    }
}

function addAmountToGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) {
        const amountToAdd = parseFloat(prompt(`ต้องการเพิ่มเงินเท่าไหร่ในเป้าหมาย "${goal.name}" (ปัจจุบันออมแล้ว ${goal.savedAmount.toLocaleString()} ฿)?`));

        if (!isNaN(amountToAdd) && amountToAdd > 0) {
            const newSavedAmount = goal.savedAmount + amountToAdd;
            if (newSavedAmount > goal.targetAmount) {
                alert(`ยอดเงินที่เพิ่มจะเกินเป้าหมาย! (เป้าหมาย: ${goal.targetAmount.toLocaleString()} ฿)`);
                return;
            }
            goal.savedAmount = newSavedAmount;
            saveData();
            renderGoals();
            renderDashboard();
            alert(`เพิ่มเงิน ${amountToAdd.toLocaleString()} ฿ ในเป้าหมาย "${goal.name}" เรียบร้อยแล้ว!`);
        } else if (amountToAdd !== null) { // If user didn't cancel, but entered invalid
            alert('กรุณากรอกจำนวนเงินที่ถูกต้องและมากกว่า 0');
        }
    }
}


// --- Gemini AI Integration ---
// IMPORTANT: Replace with your actual Gemini API Key
// You can get one from Google AI Studio: https://makersuite.google.com/
const GEMINI_API_KEY ='X-goog-api-key: GEMINI_API_KEY'; // <<< REPLACE THIS!

const analyzeDataBtn = document.getElementById('analyze-data-btn');
const aiResultsDiv = document.getElementById('ai-results');

analyzeDataBtn.addEventListener('click', async () => {
    aiResultsDiv.innerHTML = '<p class="placeholder-text">กำลังวิเคราะห์ข้อมูล... โปรดรอสักครู่</p>';

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        aiResultsDiv.innerHTML = '<p style="color: red;"><strong>ข้อผิดพลาด:</strong> กรุณาตั้งค่า GEMINI_API_KEY ในไฟล์ script.js ของคุณ</p>';
        return;
    }

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: generatePrompt()
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            aiResultsDiv.innerHTML = `<p style="color: red;"><strong>เกิดข้อผิดพลาดในการเชื่อมต่อ AI:</strong> ${errorData.error.message || 'ไม่ทราบข้อผิดพลาด'}. <br> โปรดตรวจสอบ Gemini API Key และโควต้าการใช้งาน.</p>`;
            return;
        }

        const data = await response.json();
        const aiText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

        if (aiText) {
            aiResultsDiv.innerHTML = `<strong>ผลการวิเคราะห์จาก Gemini AI:</strong><br><br>${aiText}`;
        } else {
            aiResultsDiv.innerHTML = '<p class="placeholder-text">ไม่สามารถรับคำแนะนำจาก AI ได้ในขณะนี้ โปรดลองอีกครั้งในภายหลัง</p>';
        }

    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        aiResultsDiv.innerHTML = `<p style="color: red;"><strong>เกิดข้อผิดพลาด:</strong> ไม่สามารถเชื่อมต่อกับ Gemini AI ได้. (${error.message})</p>`;
    }
});

function generatePrompt() {
    let prompt = "วิเคราะห์ข้อมูลการเงินส่วนบุคคลต่อไปนี้ และให้คำแนะนำที่ใช้งานได้จริงเพื่อช่วยในการออมเงินและบรรลุเป้าหมายทางการเงิน:\n\n";

    // Summarize transactions
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseCategories = {};
    const incomeSources = {};

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
            incomeSources[t.description] = (incomeSources[t.description] || 0) + t.amount;
        } else {
            totalExpense += t.amount;
            expenseCategories[t.description] = (expenseCategories[t.description] || 0) + t.amount;
        }
    });

    prompt += `**ภาพรวมการเงิน:**\n`;
    prompt += `- รายรับรวม: ${totalIncome.toLocaleString()} ฿\n`;
    prompt += `- รายจ่ายรวม: ${totalExpense.toLocaleString()} ฿\n`;
    prompt += `- ยอดเงินคงเหลือปัจจุบัน: ${(totalIncome - totalExpense).toLocaleString()} ฿\n\n`;

    if (Object.keys(incomeSources).length > 0) {
        prompt += `**แหล่งรายรับหลัก:**\n`;
        for (const [source, amount] of Object.entries(incomeSources)) {
            prompt += `- ${source}: ${amount.toLocaleString()} ฿\n`;
        }
        prompt += '\n';
    }

    if (Object.keys(expenseCategories).length > 0) {
        prompt += `**ประเภทรายจ่ายหลัก (5 อันดับแรก):**\n`;
        const sortedExpenses = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);
        sortedExpenses.slice(0, 5).forEach(([category, amount]) => {
            prompt += `- ${category}: ${amount.toLocaleString()} ฿\n`;
        });
        prompt += '\n';
    }


    // Summarize goals
    if (goals.length > 0) {
        prompt += `**เป้าหมายการออม:**\n`;
        goals.forEach(g => {
            const progress = (g.savedAmount / g.targetAmount) * 100;
            const remaining = g.targetAmount - g.savedAmount;
            prompt += `- ชื่อ: ${g.name}\n`;
            prompt += `  - จำนวนเงินเป้าหมาย: ${g.targetAmount.toLocaleString()} ฿\n`;
            prompt += `  - ออมแล้ว: ${g.savedAmount.toLocaleString()} ฿ (${progress.toFixed(2)}%)\n`;
            prompt += `  - เงินที่ต้องออมเพิ่ม: ${remaining.toLocaleString()} ฿\n`;
            if (g.dueDate) {
                prompt += `  - วันที่คาดว่าจะสำเร็จ: ${g.dueDate}\n`;
            }
        });
        prompt += '\n';
    } else {
        prompt += "**เป้าหมายการออม:** ยังไม่มีเป้าหมายการออม\n\n";
    }

    prompt += `จากข้อมูลด้านบนนี้ โปรดให้คำแนะนำที่เป็นประโยชน์และเฉพาะเจาะจงเพื่อเพิ่มการออม ลดค่าใช้จ่ายที่ไม่จำเป็น และช่วยให้บรรลุเป้าหมายทางการเงินได้เร็วขึ้น หากไม่มีเป้าหมาย โปรดแนะนำการตั้งเป้าหมายทางการเงินเริ่มต้นด้วย`;

    return prompt;
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard(); // Render dashboard on initial load
    // Set active class for dashboard in sidebar initially
    document.querySelector('.nav-menu ul li[data-page="dashboard"]').classList.add('active');
    document.getElementById('dashboard-page').classList.add('active-page');
    headerTitle.textContent = 'หน้าหลัก';
});

// View all transactions button on dashboard
document.getElementById('view-all-transactions-btn').addEventListener('click', () => {
    switchPage('transactions');
});