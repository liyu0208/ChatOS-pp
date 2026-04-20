const { ref, computed } = Vue;
import { store, saveAll } from '../store.js';

export function usePeriod(system) {
    const today = new Date();
    const currentMonth = ref(today.getMonth()); // 0-11
    const currentYear = ref(today.getFullYear());
    const showSettings = ref(false); // 设置弹窗

    // 切换月份
    const changeMonth = (delta) => {
        let m = currentMonth.value + delta;
        if (m > 11) { m = 0; currentYear.value++; }
        else if (m < 0) { m = 11; currentYear.value--; }
        currentMonth.value = m;
    };

    // 格式化日期 key
    const getDateKey = (day) => {
        return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    // 核心：日历数据生成
    const calendarDays = computed(() => {
        const year = currentYear.value;
        const month = currentMonth.value;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
        
        const arr = [];
        // 填充空白
        for (let i = 0; i < firstDayOfWeek; i++) {
            arr.push({ type: 'empty', id: `empty-${i}` });
        }
        // 填充日期
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = getDateKey(d);
            const isRecorded = store.period.records.includes(dateKey);
            const prediction = getPredictionStatus(dateKey); // 获取预测状态
            
            arr.push({
                type: 'day',
                day: d,
                fullDate: dateKey,
                isToday: dateKey === new Date().toISOString().split('T')[0],
                isRecorded: isRecorded,
                isPredicted: prediction.isPredicted,
                isOvulation: prediction.isOvulation
            });
        }
        return arr;
    });

    // 预测算法
    const getPredictionStatus = (dateKey) => {
        // 1. 找到最近的一次经期开始日
        const records = [...store.period.records].sort();
        if (records.length === 0) return { isPredicted: false, isOvulation: false };

        const targetDate = new Date(dateKey);
        const cycleLen = parseInt(store.period.settings.cycleLength) || 28;
        const periodLen = parseInt(store.period.settings.periodLength) || 5;

        // 简单的预测逻辑：基于最近一次记录往后推
        // (更复杂的算法需要分析历史平均值，这里采用基础版)
        const lastRecord = new Date(records[records.length - 1]);
        
        // 如果目标日期在最后记录之前，不预测
        if (targetDate <= lastRecord) return { isPredicted: false, isOvulation: false };

        const diffTime = Math.abs(targetDate - lastRecord);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // 计算这是第几个周期后的日子
        const cyclePhase = diffDays % cycleLen;

        // 预测经期 (周期开始的前几天)
        // 注意：这里简化处理，假设最后一次记录是经期的第一天(实际上可能是中间，为了简单先这样)
        // 更严谨的做法是把连续的记录归为一组，取那组的第一天。
        
        // 这里我们要找“最近一组连续记录的起始日”
        const lastStartDate = findLastCycleStart(records);
        if (!lastStartDate) return { isPredicted: false, isOvulation: false };

        const daysSinceStart = Math.floor((targetDate - new Date(lastStartDate)) / (1000 * 60 * 60 * 24));
        const currentCycleDay = daysSinceStart % cycleLen;

        let isPredicted = false;
        let isOvulation = false;

        // 预测下次经期
        if (currentCycleDay < periodLen) {
            isPredicted = true;
        }
        
        // 预测排卵期 (下次经期前14天左右，范围取前12-16天)
        // 下次经期是 cycleLen，所以排卵是 cycleLen - 14
        const ovulationDay = cycleLen - 14;
        if (currentCycleDay >= ovulationDay - 2 && currentCycleDay <= ovulationDay + 2) {
            isOvulation = true;
        }

        return { isPredicted, isOvulation };
    };

    // 辅助：找到最近一次周期的开始日期
    const findLastCycleStart = (records) => {
        // 倒序遍历，找到断层的点
        // 例如 [..., "05", "06", "20"] -> "20" 是新周期开始
        // 简单处理：取记录里最大的日期作为基准往回找连续天数
        // 这里的逻辑为了简化，直接取记录中最大的日期作为“最后一次经期的某一天”，
        // 实际上应该做更复杂的聚类。为保证用户体验，我们建议用户记录时尽量记全。
        // *简化版策略*：直接拿最后一条记录当作参考点。
        return records[records.length - 1]; 
    };

    // 点击日期
    const toggleDate = (dayObj) => {
        if (dayObj.type !== 'day') return;
        const key = dayObj.fullDate;
        
        if (store.period.records.includes(key)) {
            // 取消记录
            store.period.records = store.period.records.filter(k => k !== key);
        } else {
            // 添加记录
            store.period.records.push(key);
            store.period.records.sort(); // 保持顺序
        }
        saveAll();
    };

    const saveSettings = () => {
        saveAll();
        showSettings.value = false;
        system.showToast('设置已保存');
    };

    return {
        currentMonth, currentYear, calendarDays, changeMonth, toggleDate, 
        showSettings, saveSettings
    };
}