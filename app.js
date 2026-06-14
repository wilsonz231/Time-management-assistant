// ==================== 全局配置 ====================
const GOALS = {
    IELTS: 40,      // 雅思准备 40%
    Writing: 20,    // 申请文书 20%
    School: 20,     // 学校任务 20%
    Rest: 10,       // 休息娱乐 10%
    Other: 10       // 其他 10%
};

const TASK_COLORS = {
    IELTS: '#FF6B6B',
    Writing: '#4ECDC4',
    School: '#45B7D1',
    Rest: '#FFA07A',
    Other: '#95E1D3'
};

const TASK_LABELS = {
    IELTS: '🎯 雅思准备',
    Writing: '✍️ 申请文书',
    School: '🏫 学校任务',
    Rest: '🎮 休息娱乐',
    Other: '📌 其他'
};

// ==================== 数据管理 ====================
let records = JSON.parse(localStorage.getItem('timeRecords')) || [];
let charts = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('recordDate').valueAsDate = new Date();
    loadIELTSInsights();
    updateAll();
});

function addRecord() {
    const date = document.getElementById('recordDate').value;
    const taskType = document.getElementById('taskType').value;
    const taskTime = parseInt(document.getElementById('taskTime').value) || 0;
    const taskNote = document.getElementById('taskNote').value;

    if (!taskType || taskTime <= 0) {
        alert('请选择任务类型并输入有效的时间');
        return;
    }

    const record = {
        id: Date.now(),
        date,
        taskType,
        taskTime,
        taskNote,
        createdAt: new Date().toISOString()
    };

    records.push(record);
    saveRecords();

    // 清空表单
    document.getElementById('taskType').value = '';
    document.getElementById('taskTime').value = '';
    document.getElementById('taskNote').value = '';

    alert('✅ 记录已添加！');
    updateAll();
}

function saveRecords() {
    localStorage.setItem('timeRecords', JSON.stringify(records));
}

function deleteRecord(id) {
    if (confirm('确定要删除这条记录吗？')) {
        records = records.filter(r => r.id !== id);
        saveRecords();
        updateAll();
    }
}

// ==================== 数据统计 ====================
function getToday() {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => r.date === today);
}

function getThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startDateStr = startOfWeek.toISOString().split('T')[0];

    return records.filter(r => r.date >= startDateStr);
}

function calculateStats(recordList) {
    const stats = {
        IELTS: 0,
        Writing: 0,
        School: 0,
        Rest: 0,
        Other: 0,
        total: 0
    };

    recordList.forEach(r => {
        stats[r.taskType] += r.taskTime;
        stats.total += r.taskTime;
    });

    // 转换为小时
    Object.keys(stats).forEach(key => {
        stats[key] = Math.round(stats[key] / 60 * 10) / 10;
    });

    return stats;
}

function calculatePercentage(stats) {
    const total = stats.total;
    if (total === 0) return {};

    const percentage = {};
    ['IELTS', 'Writing', 'School', 'Rest', 'Other'].forEach(key => {
        percentage[key] = Math.round(stats[key] / total * 100);
    });

    return percentage;
}

// ==================== UI 更新 ====================
function updateAll() {
    updateStats();
    updateTodayList();
    updateCharts();
    updateWeeklyComparison();
    generateInsights();
}

function updateStats() {
    const today = getToday();
    const thisWeek = getThisWeek();
    const weekStats = calculateStats(thisWeek);

    document.getElementById('todayCount').textContent = today.length;
    document.getElementById('weekTotal').textContent = weekStats.total + 'h';
    document.getElementById('recordDays').textContent = new Set(records.map(r => r.date)).size;

    // 计算目标达成度
    const weekPercentage = calculatePercentage(weekStats);
    const ieltsGoalProgress = weekPercentage.IELTS ? Math.round((weekPercentage.IELTS / GOALS.IELTS) * 100) : 0;
    document.getElementById('goalProgress').textContent = Math.min(ieltsGoalProgress, 100) + '%';
}

function updateTodayList() {
    const today = getToday();
    const container = document.getElementById('todayList');

    if (today.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>今天还没有记录，开始添加吧！</p></div>';
        return;
    }

    let html = '';
    today.forEach(record => {
        const hours = (record.taskTime / 60).toFixed(1);
        html += `
            <div class="task-item">
                <div class="task-info">
                    <h4>${TASK_LABELS[record.taskType]}</h4>
                    <p>${record.taskNote || '无备注'}</p>
                </div>
                <div class="task-time">${hours}h</div>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateCharts() {
    const thisWeek = getThisWeek();
    const stats = calculateStats(thisWeek);
    const percentage = calculatePercentage(stats);

    // 饼图
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (charts.pie) charts.pie.destroy();
    
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['🎯 雅思准备', '✍️ 申请文书', '🏫 学校任务', '🎮 休息娱乐', '📌 其他'],
            datasets: [{
                data: [
                    percentage.IELTS || 0,
                    percentage.Writing || 0,
                    percentage.School || 0,
                    percentage.Rest || 0,
                    percentage.Other || 0
                ],
                backgroundColor: [
                    TASK_COLORS.IELTS,
                    TASK_COLORS.Writing,
                    TASK_COLORS.School,
                    TASK_COLORS.Rest,
                    TASK_COLORS.Other
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // 柱状图
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (charts.bar) charts.bar.destroy();
    
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['🎯 雅思准备', '✍️ 申请文书', '🏫 学校任务', '🎮 休息娱乐', '📌 其他'],
            datasets: [{
                label: '小时数',
                data: [
                    stats.IELTS,
                    stats.Writing,
                    stats.School,
                    stats.Rest,
                    stats.Other
                ],
                backgroundColor: [
                    TASK_COLORS.IELTS,
                    TASK_COLORS.Writing,
                    TASK_COLORS.School,
                    TASK_COLORS.Rest,
                    TASK_COLORS.Other
                ],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
}

function updateWeeklyComparison() {
    const thisWeek = getThisWeek();
    const stats = calculateStats(thisWeek);
    const percentage = calculatePercentage(stats);

    let html = '<div class="insight-box" style="margin-bottom: 20px;"><h4>🎯 本周目标进度</h4>';
    
    const tasks = ['IELTS', 'Writing', 'School', 'Rest', 'Other'];
    tasks.forEach(task => {
        const goal = GOALS[task];
        const actual = percentage[task] || 0;
        const progress = Math.round((actual / goal) * 100);
        const status = actual >= goal ? '✅' : '⏳';
        
        html += `
            <div class="comparison-item">
                <div class="comparison-label">${TASK_LABELS[task]}</div>
                <div class="comparison-bars">
                    <div class="bar bar-plan" style="width: ${goal * 3}px;">
                        <span class="bar-label">目标: ${goal}%</span>
                    </div>
                    <div class="bar bar-actual" style="width: ${actual * 3}px;">
                        <span class="bar-label">实际: ${actual}%</span>
                    </div>
                </div>
                <div class="comparison-percent">${status} ${progress}%</div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('weeklyComparison').innerHTML = html;

    // 详细数据表
    let tableHtml = '<table style="width: 100%; border-collapse: collapse;">';
    tableHtml += '<tr style="border-bottom: 2px solid #667eea;"><th style="padding: 10px; text-align: left;">任务</th><th style="padding: 10px; text-align: center;">小时</th><th style="padding: 10px; text-align: center;">百分比</th><th style="padding: 10px; text-align: center;">目标</th><th style="padding: 10px; text-align: center;">差异</th></tr>';
    
    tasks.forEach(task => {
        const hours = stats[task];
        const actual = percentage[task] || 0;
        const goal = GOALS[task];
        const diff = actual - goal;
        const diffColor = diff >= 0 ? '#4ECDC4' : '#FF6B6B';
        
        tableHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${TASK_LABELS[task]}</td>
                <td style="padding: 10px; text-align: center;">${hours.toFixed(1)}h</td>
                <td style="padding: 10px; text-align: center;">${actual}%</td>
                <td style="padding: 10px; text-align: center;">${goal}%</td>
                <td style="padding: 10px; text-align: center; color: ${diffColor}; font-weight: bold;">${diff > 0 ? '+' : ''}${diff}%</td>
            </tr>
        `;
    });
    
    tableHtml += '</table>';
    document.getElementById('detailTable').innerHTML = tableHtml;
}

// ==================== 洞察与建议 ====================
function loadIELTSInsights() {
    // 基于用户的IELTS成绩的个性化建议
    const insights = {
        overall: 6,
        writing: 6,
        listening: 6.5,
        reading: 6.5,
        speaking: 5.5
    };
    
    localStorage.setItem('ieltsScores', JSON.stringify(insights));
}

function generateInsights() {
    const thisWeek = getThisWeek();
    const stats = calculateStats(thisWeek);
    const percentage = calculatePercentage(stats);

    let insight = '📊 本周分析：\n\n';

    // IELTS成绩分析与建议
    const ieltsScores = JSON.parse(localStorage.getItem('ieltsScores')) || {};
    
    if (percentage.IELTS >= GOALS.IELTS) {
        insight += `✅ 雅思准备时间充足！你在这个方面的投入很棒。\n`;
    } else {
        const shortage = GOALS.IELTS - percentage.IELTS;
        insight += `⏳ 雅思准备需要加强，差 ${shortage}% 的目标时间。\n`;
        
        // 根据成绩弱项给出建议
        if (ieltsScores.speaking < ieltsScores.writing) {
            insight += `💡 优先建议：你的口语成绩(${ieltsScores.speaking})比写作(${ieltsScores.writing})弱，建议增加口语练习时间。\n`;
        }
    }

    insight += `\n`;

    if (percentage.Writing >= GOALS.Writing) {
        insight += `✅ 申请文书进度很好！继续保持。\n`;
    } else {
        insight += `⏳ 申请文书需要更多时间投入。\n`;
    }

    insight += `\n📈 本周建议：\n`;
    
    // 根据数据生成个性化建议
    if (stats.total < 20) {
        insight += `• 你这周的学习时间有点少（仅 ${stats.total} 小时），建议增加到每天2-3小时。\n`;
    } else if (stats.total > 40) {
        insight += `• 很好！你有很高的学习投入（${stats.total} 小时），记得安排足够的休息。\n`;
    }

    if (percentage.Rest < 5) {
        insight += `• 休息时间过少，建议每周至少留出 10% 的时间来放松。\n`;
    }

    insight += `\n💪 继续加油！每天的小进步都在累积。`;

    document.getElementById('insightText').textContent = insight;
}

// ==================== 标签切换 ====================
function switchTab(tabName) {
    // 隐藏其他标签
    ['record', 'today'].forEach(tab => {
        const elem = document.getElementById(tab);
        if (elem) elem.classList.remove('active');
    });

    // 更新按钮状态
    document.querySelectorAll('.tabs').forEach(tabsContainer => {
        tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
    });

    // 显示目标标签
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        event.target.classList.add('active');
    }
}

function switchChart(chartType) {
    ['pie', 'bar'].forEach(chart => {
        const elem = document.getElementById(chart);
        if (elem) elem.classList.remove('active');
    });

    document.getElementById(chartType).classList.add('active');
    
    document.querySelectorAll('.tabs').forEach(tabsContainer => {
        tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
    });
    event.target.classList.add('active');
}

function switchReport(reportType) {
    ['comparison', 'detail', 'export'].forEach(report => {
        const elem = document.getElementById(report);
        if (elem) elem.classList.remove('active');
    });

    document.getElementById(reportType).classList.add('active');
    
    document.querySelectorAll('.tabs').forEach(tabsContainer => {
        tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
    });
    event.target.classList.add('active');
}

// ==================== 数据导入导出 ====================
function exportData() {
    const data = {
        records: records,
        goals: GOALS,
        exportDate: new Date().toISOString(),
        ieltsScores: JSON.parse(localStorage.getItem('ieltsScores')) || {}
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `时间管理数据_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.records && Array.isArray(data.records)) {
                records = data.records;
                saveRecords();
                if (data.ieltsScores) {
                    localStorage.setItem('ieltsScores', JSON.stringify(data.ieltsScores));
                }
                alert('✅ 数据导入成功！');
                updateAll();
            } else {
                alert('❌ 文件格式错误');
            }
        } catch (error) {
            alert('❌ 无法读取文件：' + error.message);
        }
    };
    reader.readAsText(file);
    document.getElementById('importFile').value = '';
}

function clearAllData() {
    if (confirm('⚠️ 确定要删除所有数据吗？此操作不可逆！')) {
        if (confirm('再次确认：你真的要清空所有数据吗？')) {
            records = [];
            saveRecords();
            alert('✅ 所有数据已清空');
            updateAll();
        }
    }
}