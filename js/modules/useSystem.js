const { ref, computed, onMounted } = Vue;
import { store, saveAll } from '../store.js';

export function useSystem() {
    const currentApp = ref('home');
    const activeTab = ref(0);
    const batteryLevel = ref(100);
    
    // Toast 系统
    const toasts = ref([]);
    let toastId = 0;
    const showToast = (msg, type='success') => {
        const id = toastId++;
        toasts.value.push({id, msg, type});
        setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 2000);
    };

    // 时间
    const now = ref(new Date());
    setInterval(() => now.value = new Date(), 1000);
    const currentTime = computed(() => now.value.getHours().toString().padStart(2,'0') + ':' + now.value.getMinutes().toString().padStart(2,'0'));
    const currentDate = computed(() => (now.value.getMonth()+1)+' 月 '+now.value.getDate()+'日');

    // 导航
    const openApp = (app) => currentApp.value = app;
    const goHome = () => { 
        // 这里的 currentChatId 需要从 Chat 模块传入，稍微有点耦合，
        // 简单处理：我们让 goHome 仅处理 App 级别的返回
        currentApp.value = 'home'; 
    };

    // 电量监听
    onMounted(() => {
        if (navigator.getBattery) {
            navigator.getBattery().then(b => {
                batteryLevel.value = Math.floor(b.level * 100);
                b.addEventListener('levelchange', () => { batteryLevel.value = Math.floor(b.level * 100); });
            });
        }
    });

    return {
        currentApp, activeTab, batteryLevel, toasts, showToast,
        currentTime, currentDate, openApp, goHome, saveAllManual: () => { saveAll(); showToast('保存成功'); }
    };
}