const { reactive, watch } = Vue;

const defaultState = {
    activeChats: [], diaryList:[], roleList: [], worldList: [],
    period: { records:[], settings: { cycleLength: 28, periodLength: 5 } },
    user: { name: '', prompt: '', avatar: '' },
    role: { name: 'AI', status: 'Online', prompt: 'You are helpful.', avatar: '' },
    api: { baseUrl: 'https://api.openai.com/v1', key: '', model: 'gpt-3.5-turbo' },
    theme: { css: '', bubbleCss: '', fontCss: '', iconCss: '', bgImage: '' },
    customStickers: [], stickerGroups:[],
    presets: { api: [], world: [], theme: [], user:[] },
    widgets: { page1Img: '', page2Img: '', page2Text: '✨ 在这里写下你的今日心情...' },
    customIcons: { chatApp:'', diary:'', theme:'', world:'', album:'', pendingA:'', pendingB:'', pendingC:'', period:'', api:'' }
};

export const store = reactive(JSON.parse(JSON.stringify(defaultState)));

export const initStore = () => {
    try {
        const s = localStorage.getItem('aios_ultra_store');
        if(s) {
            const data = JSON.parse(s);
            Object.assign(store, data);

            // === 防白屏与数据补充 ===
            if (!store.presets) store.presets = { api: [], world: [], theme: [], user:[] };
            if (!Array.isArray(store.presets.api)) store.presets.api =[];
            if (!Array.isArray(store.presets.theme)) store.presets.theme =[];
            if (!Array.isArray(store.presets.world)) store.presets.world =[];
            if (!Array.isArray(store.presets.user)) store.presets.user =[];
            
            if (!store.period) store.period = { records:[], settings: { cycleLength: 28, periodLength: 5 } };
            if (!Array.isArray(store.period.records)) store.period.records =[];
            if (!store.period.settings) store.period.settings = { cycleLength: 28, periodLength: 5 };

            if (!Array.isArray(store.worldList)) store.worldList =[];
            if (!Array.isArray(store.roleList)) store.roleList =[];
            if (!store.widgets) store.widgets = { page1Img: '', page2Img: '', page2Text: '✨ 在这里写下你的今日心情...' };
            if (!store.customIcons) store.customIcons = { chatApp:'', diary:'', theme:'', world:'', album:'', pendingA:'', pendingB:'', pendingC:'', period:'', api:'' };
        }
    } catch(e) { 
        console.error("Load Error:", e);
        Object.assign(store, defaultState);
    }

    if (!store.theme.bubbleCss) store.theme.bubbleCss = '';
    if (!store.theme.fontCss) store.theme.fontCss = '';
    if (!store.theme.iconCss) store.theme.iconCss = '';
    if (!store.theme.bgImage) store.theme.bgImage = '';
    if (!store.presets.bubble) store.presets.bubble =[];
    if (!store.presets.font) store.presets.font =[];
    if (!store.presets.icon) store.presets.icon =[];

    // === 官方初始预设 (全系统3D果冻泡泡版) ===
 // === 官方初始预设 (包含万能变色引擎与圆体字) ===
// === 官方初始预设 (修复图标丢失问题) ===
    if (!store.presets.theme || store.presets.theme.length === 0) {
        store.presets.theme =[
            
            {
                name: "💧 蓝色泡泡 (动态全站覆盖)",
                data: { 
                    css: `:root {  
    --theme-main: #0284c7;   /* 调深主蓝色，让“应用”按钮显眼 */
  --theme-light: #f0f9ff;  /* 调亮背景，让浅色按钮有底色感 */
  --theme-text: #075985;   /* 调深文字，让所有标题清晰 */
                    
/* 全站细圆体替换 (修复版：不排除所有的i，而是使用not选择器保护FontAwesome) */
*:not(i) { font-family: ui-rounded, 'Varela Round', 'Nunito', 'PingFang SC', sans-serif !important; }
.font-bold { font-weight: 600 !important; }
.text-7xl { font-weight: 400 !important; }

/* 🌟 万能主题引擎 */
[class*="text-[#8b5e3c]"],[class*="text-rose-"],[class*="text-blue-"], .text-slate-800, .text-slate-700 { color: var(--theme-text) !important; }
[class*="bg-[#8b5e3c]"], [class*="bg-rose-"], [class*="bg-blue-"], [class*="bg-[#95ec69]"], [class*="bg-[#07c160]"] { background-color: var(--theme-main) !important; color: #000000 !important; border-color: var(--theme-main) !important; }
[class*="bg-[#ede6d4]"],[class*="bg-rose-50"], [class*="bg-blue-50"] { background-color: var(--theme-light) !important; color: #075985 !important; border: 1px solid #bae6fd !important; }
.period-day.recorded { background-color: var(--theme-main) !important; border-color: var(--theme-main) !important; color: white !important; box-shadow: 0 4px 10px rgba(14,165,233,0.3) !important; }
.period-day.predicted { background-color: var(--theme-light) !important; border-color: var(--theme-main) !important; color: var(--theme-text) !important; }

/* 泡泡圆角与基础排版 */
.app-layout { background: linear-gradient(135deg, #f3f9fd 0%, #e2f0f7 100%) !important; }
.app-header { background: rgba(255,255,255,0.4) !important; backdrop-filter: blur(20px) !important; border-bottom: 2px solid rgba(255,255,255,0.8) !important; border-radius: 0 0 35px 35px !important; box-shadow: 0 10px 25px rgba(14,165,233,0.08) !important; padding-bottom: 15px !important; margin-bottom: 10px; }
.app-header h1, .app-header i, .app-header button { color: var(--theme-text) !important; font-weight: 700 !important; }
.tab-bar { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(20px) !important; border-top: 2px solid rgba(255,255,255,0.9) !important; border-radius: 35px 35px 0 0 !important; box-shadow: 0 -10px 25px rgba(14,165,233,0.08) !important; }
.tab-item.active { color: var(--theme-main) !important; font-weight: bold; }
.tab-item i, .tab-item span { color: var(--theme-text) !important; opacity: 0.6; }

/* 强制全站白卡片变圆泡泡 */
.bg-white, .bg-gray-50, .setting-section { background: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(20px) !important; border-radius: 35px !important; border: 2px solid rgba(255,255,255,0.9) !important; box-shadow: 0 8px 25px rgba(14,165,233,0.1), inset 0 4px 10px rgba(255,255,255,0.8) !important; }
.border-b, .border-t, .border-gray-100 { border-color: transparent !important; }
.rounded-xl, .rounded-lg, .rounded-2xl { border-radius: 35px !important; }

/* 按钮、输入框变胶囊 */
input, select, textarea { border-radius: 25px !important; background: rgba(255,255,255,0.6) !important; border: 2px solid white !important; color: var(--theme-text) !important; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important; }
button, .cute-btn, .save-btn, .action-mini-btn, .paw-btn { border-radius: 99px !important; border: 2px solid white !important; box-shadow: 0 4px 15px rgba(14,165,233,0.15) !important; font-weight: bold !important; color: var(--theme-text); }
button[class*="bg-"] { color: #2facff !important; border-color: var(--theme-main) !important; }
img { border-radius: 25px !important; }

.sys-text { color: var(--theme-text) !important; }
.sys-border { border-color: var(--theme-text) !important; }
.sys-bg { background-color: var(--theme-main) !important; }
.app-name { color: var(--theme-text) !important; font-weight: 700; letter-spacing: 1px; }`,
                    iconCss: `.app-icon { background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%) !important; backdrop-filter: blur(15px) !important; border: 3px solid white !important; box-shadow: 0 12px 25px rgba(14,165,233,0.2), inset 0 6px 12px rgba(255,255,255,1) !important; border-radius: 50% !important; transition: transform 0.3s; }
.app-icon:active { transform: scale(0.85) !important; }
.app-icon i { display: inline-block !important; color: #35abe1 !important; font-size: 28px !important; text-shadow: 0 3px 6px rgba(14,165,233,0.3) !important; -webkit-text-fill-color: #0ea5e9 !important; z-index: 10; }
.app-icon::after { display: none !important; }
.dock-container { border-radius: 50px !important; background: rgba(255,255,255,0.4) !important; border: 3px solid rgba(255,255,255,0.8) !important; }`,
                    bubbleCss: `.bubble-user { border-radius: 25px 25px 5px 25px !important; background: var(--theme-main) !important; color: #cad9e2 !important; border: 2px solid var(--theme-light) !important; box-shadow: 0 4px 10px rgba(148, 221, 255, 0.47); }
.bubble-ai { border-radius: 25px 25px 25px 5px !important; border: 2px solid white !important; background: rgba(255,255,255,0.8) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.wallpaper-bg { background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 10%), radial-gradient(circle at 80% 70%, rgba(255,255,25 five! important; }
.dock-container { border-radius:  fifty px ! important; background: rgba( twenty five five , twenty five five , twenty five five , zero . four ) ! important; border: three px solid rgba( twenty five five , twenty five five , twenty five five , zero . eight ) ! important; }`,
bubbleCss: `.bubble-user { border-radius: 28px 28px 4px 28px !important; background-color: rgba(2, 132, 199, 0.4) !important; background-image: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%) !important; color: white !important; border: 2px solid rgba(255,255,255,0.5) !important; box-shadow: 0 8px 16px rgba(14,165,233,0.2), inset 0 6px 12px rgba(255,255,255,0.6), inset 0 -4px 10px rgba(0,0,0,0.08) !important; backdrop-filter: blur(12px) !important; transform-origin: right bottom; animation: jellyPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.bubble-ai { border-radius: 28px 28px 28px 4px !important; background-color: rgba(255, 255, 255, 0.1) !important; background-image: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%) !important; color: var(--theme-text) !important; border: 2px solid rgba(255,255,255,0.8) !important; box-shadow: 0 8px 16px rgba(0,0,0,0.05), inset 0 6px 12px rgba(255,255,255,0.9), inset 0 -4px 10px rgba(0,0,0,0.03) !important; backdrop-filter: blur(12px) !important; transform-origin: left bottom; animation: jellyPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes jellyPop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.wallpaper-bg { background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 10%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0%, transparent 15%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 20%); background-size: 150% 150%; animation: bubbleFloat 10s ease-in-out infinite alternate; }
@keyframes bubbleFloat { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }`,
                    bgImage: ""
                }
            },
            {
                name: "🌸 粉色泡泡 (动态全站覆盖)",
                data: { 
                    css: `:root { --theme-main: #e5a0c3; --theme-light: rgba(255,255,255,0.6); --theme-text: #e26a9c; }
/* 修复版：保护图标，不让方块字出现！ */
*:not(i) { font-family: ui-rounded, 'Varela Round', 'Nunito', 'PingFang SC', sans-serif !important; }
.font-bold { font-weight: 600 !important; }
.text-7xl { font-weight: 400 !important; }

/* 🌟 万能主题引擎 */
[class*="text-[#8b5e3c]"],[class*="text-rose-"], [class*="text-blue-"], .text-slate-800, .text-slate-700 { color: var(--theme-text) !important; }
[class*="bg-[#8b5e3c]"], [class*="bg-rose-"], [class*="bg-blue-"], [class*="bg-[#95ec69]"], [class*="bg-[#07c160]"] { background-color: var(--theme-main) !important; color: white !important; border-color: var(--theme-main) !important; }
.period-day.recorded { background-color: var(--theme-main) !important; border-color: var(--theme-main) !important; color: white !important; box-shadow: 0 4px 10px rgba(236,72,153,0.3) !important; }
.period-day.predicted { background-color: var(--theme-light) !important; border-color: var(--theme-main) !important; color: var(--theme-text) !important; }

.app-layout { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%) !important; }
.app-header { background: rgba(255,255,255,0.4) !important; backdrop-filter: blur(20px) !important; border-bottom: 2px solid rgba(255,255,255,0.8) !important; border-radius: 0 0 35px 35px !important; box-shadow: 0 10px 25px rgba(236,72,153,0.15) !important; padding-bottom: 15px !important; margin-bottom: 10px; }
.app-header h1, .app-header i, .app-header button { color: var(--theme-text) !important; font-weight: 700 !important; }
.tab-bar { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(20px) !important; border-top: 2px solid rgba(255,255,255,0.9) !important; border-radius: 35px 35px 0 0 !important; box-shadow: 0 -10px 25px rgba(236,72,153,0.15) !important; }
.tab-item.active { color: var(--theme-main) !important; font-weight: bold; }
.tab-item i, .tab-item span { color: var(--theme-text) !important; opacity: 0.6; }

.bg-white, .bg-gray-50, .setting-section { background: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(20px) !important; border-radius: 35px !important; border: 2px solid rgba(255,255,255,0.9) !important; box-shadow: 0 8px 25px rgba(236,72,153,0.15), inset 0 4px 10px rgba(255,255,255,0.8) !important; }
.border-b, .border-t, .border-gray-100 { border-color: transparent !important; }
.rounded-xl, .rounded-lg, .rounded-2xl { border-radius: 35px !important; }

input, select, textarea { border-radius: 25px !important; background: rgba(255,255,255,0.6) !important; border: 2px solid white !important; color: var(--theme-text) !important; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important; }
button, .cute-btn, .save-btn, .action-mini-btn, .paw-btn { 
    border-radius: 99px !important; 
    border: 2px solid white !important; 
    box-shadow: 0 4px 15px rgba(14,165,233,0.15) !important; 
    font-weight: bold !important; 
    color: #000000 !important; /* ← 强制改成纯黑色，确保百分之百能看到 */
}
button[class*="bg-"] { color: #9d174d !important; border-color: var(--theme-main) !important; }
img { border-radius: 25px !important; }

.sys-text { color: var(--theme-text) !important; }
.sys-border { border-color: var(--theme-text) !important; }
.sys-bg { background-color: var(--theme-main) !important; }
.app-name { color: var(--theme-text) !important; font-weight: 700; letter-spacing: 1px; }`,
                    iconCss: `.app-icon { background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%) !important; backdrop-filter: blur(15px) !important; border: 3px solid white !important; box-shadow: 0 12px 25px rgba(236,72,153,0.2), inset 0 6px 12px rgba(255,255,255,1) !important; border-radius: 50% !important; transition: transform 0.3s; }
.app-icon:active { transform: scale(0.85) !important; }
.app-icon i { display: inline-block !important; color: var(--theme-main) !important; font-size: 28px !important; text-shadow: 0 3px 6px rgba(236,72,153,0.3) !important; -webkit-text-fill-color: var(--theme-main) !important; z-index: 10; }
.app-icon::after { display: none !important; }
.dock-container { border-radius: 50px !important; background: rgba(255,255,255,0.4) !important; border: 3px solid rgba(255,255,255,0.8) !important; }`,
                    bubbleCss: `.bubble-user { border-radius: 25px 25px 5px 25px !important; background: var(--theme-main) !important; color: white !important; border: 2px solid var(--theme-light) !important; box-shadow: 0 4px 10px rgba(236,72,153,0.3); }
.bubble-ai { border-radius: 25px 25px 25px 5px !important; border: 2px solid white !important; background: rgba(255,255,255,0.8) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.wallpaper-bg { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%) !important; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 10%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0%, transparent 15%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 20%); background-size: 150% 150%; animation: bubbleFloat 10s ease-in-out infinite alternate; }`,
                    bgImage: ""
                }
            },
            {
                name: "🍋 黄色泡泡 (动态全站覆盖)",
                data: { 
                    css: `:root { --theme-main: #fdae25;/* 变成深一点的咖色，让“应用”按钮更清晰 */
                     --theme-light: rgb(255, 231, 203); /* 调高不透明度，让“上传壁纸”按钮更白一点 */
                     --theme-text: #ffbf0e;/* 变成深棕色，让标题和图标名字一眼就能看清 */ }
/* 修复版：保护图标，不让方块字出现！ */
*:not(i) { font-family: ui-rounded, 'Varela Round', 'Nunito', 'PingFang SC', sans-serif !important; }
.font-bold { font-weight: 600 !important; }
.text-7xl { font-weight: 400 !important; }

/* 🌟 万能主题引擎 */[class*="text-[#8b5e3c]"], [class*="text-rose-"],[class*="text-blue-"], .text-slate-800, .text-slate-700 { color: var(--theme-text) !important; }
[class*="bg-[#8b5e3c]"], [class*="bg-rose-"], [class*="bg-blue-"], [class*="bg-[#95ec69]"], [class*="bg-[#07c160]"] { background-color: var(--theme-main) !important; color: white !important; border-color: var(--theme-main) !important; }
[class*="bg-[#ede6d4]"],[class*="bg-rose-50"], [class*="bg-blue-50"] { background-color: var(--theme-light) !important; color: var(--theme-text) !important; border: none !important; }
.period-day.recorded { background-color: var(--theme-main) !important; border-color: var(--theme-main) !important; color: white !important; box-shadow: 0 4px 10px rgba(234,179,8,0.3) !important; }
.period-day.predicted { background-color: var(--theme-light) !important; border-color: var(--theme-main) !important; color: var(--theme-text) !important; }

.app-layout { background: linear-gradient(135deg, #f8ebb7 0%, #fde047 100%) !important; }
.app-header { background: rgba(255,255,255,0.4) !important; backdrop-filter: blur(20px) !important; border-bottom: 2px solid rgb(255, 207, 125) !important; border-radius: 0 0 35px 35px !important; box-shadow: 0 10px 25px rgba(234,179,8,0.15) !important; padding-bottom: 15px !important; margin-bottom: 10px; }
.app-header h1, .app-header i, .app-header button { color: var(--theme-text) !important; font-weight: 700 !important; }
.tab-bar { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(20px) !important; border-top: 2px solid rgba(255, 111, 111, 0.9) !important; border-radius: 35px 35px 0 0 !important; box-shadow: 0 -10px 25px rgba(234,179,8,0.15) !important; }
.tab-item.active { color: var(--theme-main) !important; font-weight: bold; }
.tab-item i, .tab-item span { color: var(--theme-text) !important; opacity: 0.6; }

.bg-white, .bg-gray-50, .setting-section { background: rgba(255, 255, 255, 0.92) !important; backdrop-filter: blur(20px) !important; border-radius: 35px !important; border: 2px solid rgba(255,255,255,0.9) !important; box-shadow: 0 8px 25px rgba(234,179,8,0.15), inset 0 4px 10px rgba(255, 213, 98, 0.8) !important; }
.border-b, .border-t, .border-gray-100 { border-color: transparent !important; }
.rounded-xl, .rounded-lg, .rounded-2xl { border-radius: 35px !important; }

input, select, textarea { border-radius: 25px !important; background: rgba(255,255,255,0.6) !important; border: 2px solid white !important; color: var(--theme-text) !important; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important; }
button, .cute-btn, .save-btn, .action-mini-btn, .paw-btn { border-radius: 99px !important; border: 2px solid white !important; box-shadow: 0 4px 15px rgba(234,179,8,0.15) !important; font-weight: bold !important; color: var(--theme-text); }
button[class*="bg-"] { color: #fe9925 !important; border-color: var(--theme-main) !important; }

img { border-radius: 25px !important; }

.sys-text { color: var(--theme-text) !important; }
.sys-border { border-color: var(--theme-text) !important; }
.sys-bg { background-color: var(--theme-main) !important; }
.app-name { color: var(--theme-text) !important; font-weight: 700; letter-spacing: 1px; }`,
                    iconCss: `.app-icon { background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%) !important; backdrop-filter: blur(15px) !important; border: 3px solid white !important; box-shadow: 0 12px 25px rgba(234,179,8,0.2), inset 0 6px 12px rgba(255,255,255,1) !important; border-radius: 50% !important; transition: transform 0.3s; }
.app-icon:active { transform: scale(0.85) !important; }
.app-icon i { display: inline-block !important; color: var(--theme-main) !important; font-size: 28px !important; text-shadow: 0 3px 6px rgba(234,179,8,0.3) !important; -webkit-text-fill-color: var(--theme-main) !important; z-index: 10; }
.app-icon::after { display: none !important; }
.dock-container { border-radius: 50px !important; background: rgba(255,255,255,0.4) !important; border: 3px solid rgba(255,255,255,0.8) !important; }`,
                    bubbleCss: `.bubble-user { border-radius: 25px 25px 5px 25px !important; background: var(--theme-main) !important; color: white !important; border: 2px solid var(--theme-light) !important; box-shadow: 0 4px 10px rgba(234,179,8,0.3); }
.bubble-ai { border-radius: 25px 25px 25px 5px !important; border: 2px solid white !important; background: rgba(255, 255, 255, 0.56) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.wallpaper-bg { background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%) !important; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 10%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0%, transparent 15%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 20%); background-size: 150% 150%; animation: bubbleFloat 10s ease-in-out infinite alternate; }`,
                    bgImage: ""
                }
            }
        ];
    }
};

export const saveAll = () => {
    try { localStorage.setItem('aios_ultra_store', JSON.stringify(store)); } catch (e) {}
};

watch(() => store.theme, (val) => {
    let el = document.getElementById('user-custom-css');
    if(!el) { el = document.createElement('style'); el.id='user-custom-css'; document.head.appendChild(el); }
    let combined = (val.css || '') + '\n' + (val.bubbleCss || '') + '\n' + (val.fontCss || '') + '\n' + (val.iconCss || '');
    if(val.bgImage) {
        combined += `\n.wallpaper-bg { background-image: url('${val.bgImage}') !important; }`;
        combined += `\n.app-layout { background: url('${val.bgImage}') no-repeat center center / cover !important; }`;
    }
    el.innerText = combined;
}, { deep: true, immediate: true });