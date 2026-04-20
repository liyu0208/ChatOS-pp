const { ref, computed } = Vue;
import { store, saveAll } from '../store.js';

export function useDiary(system) {
    const diaryTab = ref('record');
    const diaryInput = ref('');
    const diaryDateInput = ref('');
    const diaryTimeInput = ref('');
    const diaryWeather = ref('sunny');
    const diaryImages = ref([]);

    const weatherMap = {
        'sunny': { icon: 'fas fa-sun', color: 'text-orange-400' },
        'cloudy': { icon: 'fas fa-cloud', color: 'text-gray-400' },
        'rainy': { icon: 'fas fa-cloud-rain', color: 'text-blue-400' },
        'snowy': { icon: 'fas fa-snowflake', color: 'text-blue-200' },
    };

    const toggleWeather = () => {
        const types = Object.keys(weatherMap);
        const next = (types.indexOf(diaryWeather.value) + 1) % types.length;
        diaryWeather.value = types[next];
    };

    const saveDiary = () => {
        if(!diaryInput.value.trim() && !diaryImages.value.length) return;
        store.diaryList.unshift({ 
            id: Date.now(), 
            date: new Date().toLocaleString(), 
            weather: diaryWeather.value, 
            content: diaryInput.value, 
            images: [...diaryImages.value] 
        });
        diaryInput.value = ''; diaryImages.value = []; 
        saveAll(); 
        system.showToast('日记已发布');
    };

    // 日历相关
    const calendarDate = ref(new Date());
    const changeMonth = (d) => calendarDate.value = new Date(calendarDate.value.setMonth(calendarDate.value.getMonth()+d));
    const calendarGrid = computed(() => {
        const year = calendarDate.value.getFullYear(), month = calendarDate.value.getMonth();
        const first = new Date(year, month, 1).getDay(), days = new Date(year, month+1, 0).getDate();
        const grid = []; for(let i=0;i<first;i++) grid.push({type:'empty'});
        for(let i=1;i<=days;i++) {
            const d = store.diaryList.find(x => { const dt = new Date(x.id); return dt.getFullYear()===year && dt.getMonth()===month && dt.getDate()===i; });
            grid.push({type:'day', day:i, entry:d});
        }
        return grid;
    });

    const randomMemory = computed(() => store.diaryList.length ? store.diaryList[Math.floor(Math.random()*store.diaryList.length)] : null);

    return {
        diaryTab, diaryInput, diaryDateInput, diaryTimeInput, diaryWeather, diaryImages,
        weatherMap, toggleWeather, saveDiary, calendarDate, changeMonth, calendarGrid, randomMemory,
        addDiaryImage:()=>{}, triggerDiaryAI:()=>{}
    };
}