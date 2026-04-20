const { createApp, ref, reactive, computed, onMounted } = Vue;

import { store, initStore, saveAll } from './store.js';
import { defaultDogAvatar, defaultCatAvatar } from './utils.js';
import { useSystem } from './modules/useSystem.js';
import { useChat } from './modules/useChat.js';
import { useDiary } from './modules/useDiary.js';
import { usePeriod } from './modules/usePeriod.js'; // 确保引入了


createApp({
    setup() {
         const showChatPanel = ref(false); // ✨ 用来控制底部面板的开关
        initStore();
        let particles = [];
        let canvas, ctx;

        const spawnBurst = (x, y, color, isBig = false) => {
            const count = isBig ? 36 : 18;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
                const speed = 2.5 + Math.random() * 6;
                particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, size: 4 + Math.random() * 12, alpha: 1, color, decay: 0.015 + Math.random() * 0.015, isBubble: Math.random() > 0.4 });
            }
        };

        const animParticles = () => {
            if(!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles = particles.filter(p => p.alpha > 0.01);
            particles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                if (p.isBubble) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.stroke(); }
                else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); }
                p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= p.decay;
            });
            requestAnimationFrame(animParticles);
        };

        const handleBubblePop = (e, msg, color, isBig = false) => {
            const btn = e.currentTarget;
            btn.classList.remove('popping');
            void btn.offsetWidth;
            btn.classList.add('popping');
            const rect = btn.getBoundingClientRect();
            spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, color, isBig);
            system.showToast(msg);
        };
// --- 替换结束 ---
        initStore();
        
        const system = useSystem();
        const chat = useChat(system);
        const diary = useDiary(system);
        const period = usePeriod(system); // 启用经期逻辑
        // --- 泡泡核心逻辑开始 ---

// --- 泡泡核心逻辑结束 ---

        // 通讯录加号
        const showAddMenu = ref(false);
        const openAddMenu = () => { showAddMenu.value = true; };
        // 📱 桌面滑动与小组件逻辑
        const homePage = ref(0); // 0是第一页，1是第二页
        const homeTouchStartX = ref(0);
        
        const onHomeTouchStart = (e) => { homeTouchStartX.value = e.touches[0].clientX; };
        const onHomeTouchEnd = (e) => {
            const diff = homeTouchStartX.value - e.changedTouches[0].clientX;
            if (diff > 50 && homePage.value < 1) homePage.value = 1; // 左滑翻下一页
            else if (diff < -50 && homePage.value > 0) homePage.value = 0; // 右滑翻上一页
        };
        
        const uploadWidgetImg = (e, target) => {
            handleImageUpload(e.target.files[0], (base64) => {
                if(target === 1) store.widgets.page1Img = base64;
                else if(target === 2) store.widgets.page2Img = base64;
                saveAll(); system.showToast('小组件已更新');
            }); e.target.value = '';
        };
        const closeAddMenu = () => { showAddMenu.value = false; };

        // Role 逻辑
        const showEditRoleModal = ref(false);
        const tempEditRole = reactive({});
        const currentEditIndex = ref(-1);
        const createNewRole = () => { Object.assign(tempEditRole, {name:'', avatar:'', prompt:'', status:''}); currentEditIndex.value = -1; showEditRoleModal.value = true; };
        const saveEditRole = () => { 
            const newRole = { ...tempEditRole };
            if (!newRole.avatar) newRole.avatar = defaultDogAvatar;
            if (currentEditIndex.value === -1) store.roleList.push(newRole);
            else store.roleList[currentEditIndex.value] = newRole;
            saveAll(); system.showToast('角色已保存'); showEditRoleModal.value = false; 
        };
        const openEditRole = (role, idx) => { Object.assign(tempEditRole, role); currentEditIndex.value = idx; showEditRoleModal.value = true; };
        const deleteEditRole = () => { if(currentEditIndex.value !== -1) { store.roleList.splice(currentEditIndex.value, 1); saveAll(); } showEditRoleModal.value = false; };
        const startChatFromContact = (role) => {
            const newChat = { id: Date.now(), name: role.name, avatar: role.avatar, prompt: role.prompt, messages: [], lastTime: system.currentTime.value, lastMsg: '新会话' };
            store.activeChats.unshift(newChat); saveAll(); system.activeTab.value = 0; chat.enterChat(newChat.id);
        };

        // World 逻辑
// World 逻辑 (手机适配重构版)
        const worldCurrentView = ref('home'); // 控制当前页面：'home'(主菜单), 'global'(全局), 'role'(专属)
        const expandedRole = ref(null);       // 记录当前向下展开了哪个角色
        const showWorldMenu = ref(false);
        const isWorldBatchMode = ref(false);
        const selectedWorldIds = ref([]);
        
        // 页面跳转动作
        const goWorldHome = () => { worldCurrentView.value = 'home'; isWorldBatchMode.value = false; };
        const goWorldGlobal = () => { worldCurrentView.value = 'global'; isWorldBatchMode.value = false; };
        const goWorldRole = () => { worldCurrentView.value = 'role'; expandedRole.value = null; isWorldBatchMode.value = false; };
        
        // 角色点击展开/收起
        const toggleRoleExpand = (roleName) => {
            if (expandedRole.value === roleName) expandedRole.value = null; // 如果点的是自己，就收起
            else expandedRole.value = roleName; // 否则展开新的
        };

        const worldRoleList = computed(() => {
            const roles = new Set();
            store.roleList.forEach(r => roles.add(r.name));
            (store.worldList ||[]).forEach(w => { if(w.type === 'role' && w.roleName) roles.add(w.roleName); });
            return Array.from(roles);
        });
        
        // 获取两类世界书的数据
        const globalWorldBooks = computed(() => (store.worldList ||[]).filter(w => w.type === 'global'));
        const getRoleWorldBooks = (roleName) => (store.worldList ||[]).filter(w => w.type === 'role' && w.roleName === roleName);

        const handleWorldMenu = (action) => {
            showWorldMenu.value = false;
            if (action === 'new') createNewWorld();
            else if (action === 'import') document.getElementById('hidden-world-input').click();
            else if (action === 'batch') { isWorldBatchMode.value = !isWorldBatchMode.value; selectedWorldIds.value =[]; }
        };
        const toggleSelection = (id) => { if (selectedWorldIds.value.includes(id)) selectedWorldIds.value = selectedWorldIds.value.filter(i => i !== id); else selectedWorldIds.value.push(id); };
        const deleteSelectedWorlds = () => { if (confirm(`删除 ${selectedWorldIds.value.length} 条?`)) { store.worldList = store.worldList.filter(w => !selectedWorldIds.value.includes(w.id)); saveAll(); isWorldBatchMode.value = false; selectedWorldIds.value =[]; } };
        
        const createNewWorld = () => {
            if (worldCurrentView.value === 'role' && !expandedRole.value) return system.showToast('请先点击展开一个角色', 'error');
            const name = prompt("名称/关键词:"); if (!name) return;
            store.worldList.push({ id: Date.now(), name, keys: name, content: '', type: worldCurrentView.value, roleName: expandedRole.value || '', enabled: true, expanded: true });
            saveAll();
        };
        const deleteWorldBook = (id) => { if(confirm('删除?')) { const i = store.worldList.findIndex(w=>w.id===id); if(i!==-1) store.worldList.splice(i,1); saveAll(); } };
        const toggleWorldEntry = (book) => { book.enabled = !book.enabled; saveAll(); };
        const importWorldFile = (e) => {
            const f = e.target.files[0]; if(!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
                try {
                    const json = JSON.parse(ev.target.result);
                    const entries = Array.isArray(json) ? json : (json.entries ? Object.values(json.entries) :[]);
                    const isRole = (worldCurrentView.value === 'role');
                    if (isRole && !expandedRole.value) return system.showToast('请先展开一个角色再导入', 'error');
                    
                    entries.forEach(entry => { store.worldList.push({ id: Date.now() + Math.random(), name: entry.comment || entry.key || '未命名', keys: Array.isArray(entry.key) ? entry.key.join(',') : (entry.key || ''), content: entry.content || '', type: isRole ? 'role' : 'global', roleName: isRole ? expandedRole.value : '', enabled: true, expanded: false }); });
                    saveAll(); system.showToast('导入成功');
                } catch(err) { system.showToast('格式错误'); }
            }; r.readAsText(f); e.target.value='';
        };
// API 与预设逻辑
        const modelList = ref([]);
        const fetching = ref(false);
        const fetchModels = async () => {
            if (!store.api.baseUrl || !store.api.key) return system.showToast('请填写API', 'error');
            fetching.value = true;
            try {
                let url = store.api.baseUrl.replace(/\/+$/, ''); if (!url.endsWith('/models')) url += '/models';
                const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${store.api.key}` } });
                if(!res.ok) throw new Error(res.status);
                const data = await res.json();
                modelList.value = Array.isArray(data) ? data : (data.data ||[]);
                system.showToast(`获取 ${modelList.value.length} 个模型`);
                if (!store.api.model && modelList.value.length > 0) store.api.model = modelList.value[0].id;
            } catch (e) { system.showToast('拉取失败: '+e.message, 'error'); } finally { fetching.value = false; }
        };
        
        // --- 🎨 美化 App 新逻辑 ---
        const themeCurrentView = ref('home'); // home, bubble, font, icon, global
        const themeBgUrlInput = ref('');
        const handleThemeBgUpload = (e) => {
            handleImageUpload(e.target.files[0], (base64) => {
                store.theme.bgImage = base64; saveAll(); system.showToast('本地背景已应用');
            }); e.target.value = '';
        };
        const setThemeBgUrl = () => {
            if(themeBgUrlInput.value) { store.theme.bgImage = themeBgUrlInput.value; saveAll(); system.showToast('网络背景已应用'); }
        };

        // 覆盖导入CSS的逻辑，让它知道当前应该导给哪个模块
        const importCssFile = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(themeCurrentView.value === 'bubble') store.theme.bubbleCss = ev.target.result;
                else if(themeCurrentView.value === 'font') store.theme.fontCss = ev.target.result;
                else if(themeCurrentView.value === 'icon') store.theme.iconCss = ev.target.result;
                else store.theme.css = ev.target.result;
                saveAll(); system.showToast('CSS 导入成功');
            }; reader.readAsText(file); e.target.value = '';
        };

// --- 更强大的预设管理器 ---
        const presetSelect = reactive({ api: -1, world: -1, theme: -1, user: -1, bubble: -1, font: -1, icon: -1 });
        const presetNameInput = reactive({ api: '', world: '', theme: '', user: '', bubble: '', font: '', icon: '' });
        

// 🌟 修复版：清除浏览器关于美化的旧记忆并刷新 🌟
        const restoreThemePresets = () => {
            if(confirm('这将会清除旧的美化记忆，并加载最新预设（网页将会刷新）。确定吗？')) {
                store.presets.theme =[]; // 1. 清空旧的美化记忆
                saveAll(); // 2. 把空白记忆保存给浏览器
                window.location.reload(); // 3. 强制刷新！系统醒来发现没记忆了，就会自动加载最新的动图线稿包！
            }
        };

        // 🌟 新增：核弹级功能 - 清除浏览器所有记忆 (恢复出厂设置) 🌟
        const clearAllBrowserMemory = () => {
            if(confirm('⚠️ 警告：这会删除你的所有聊天记录、日记、角色和美化设置！相当于恢复出厂设置！你确定要彻底清空吗？')) {
                localStorage.removeItem('aios_ultra_store'); // 直接把浏览器的仓库炸掉
                window.location.reload(); // 刷新网页
            }
        };// 🌟 新增：自定义图标替换逻辑 🌟
        const currentEditIconApp = ref('');
        const triggerIconUpload = (appKey) => {
            currentEditIconApp.value = appKey;
            document.getElementById('custom-icon-upload').click();
        };
        const handleCustomIconUpload = (e) => {
            handleImageUpload(e.target.files[0], (base64) => {
                store.customIcons[currentEditIconApp.value] = base64;
                saveAll(); system.showToast('图标已换上新衣服！');
            }); e.target.value = '';
        };
        const clearAllCustomIcons = () => {
            if(confirm('确定要清除所有自己上传的图标，恢复主题默认吗？')) {
                store.customIcons = { chatApp:'', diary:'', theme:'', world:'', album:'', pendingA:'', pendingB:'', pendingC:'', period:'', api:'' };
                saveAll(); system.showToast('图标已恢复默认');
            }
        };

        const savePreset = (t) => {
            const n = presetNameInput[t]; if(!n) return;
            if(!store.presets[t]) store.presets[t] =[];
            let d = t==='api'?{...store.api}:(t==='user'?store.user.prompt:(t==='bubble'?{bubbleCss:store.theme.bubbleCss}:(t==='font'?{fontCss:store.theme.fontCss}:(t==='icon'?{iconCss:store.theme.iconCss}:{...store.theme}))));
            store.presets[t].push({ name: n, data: d });
            saveAll(); system.showToast('已保存'); presetNameInput[t]='';
        };
        const loadPreset = (t) => {
            const idx = presetSelect[t]; if(idx===-1) return;
            const p = store.presets[t][idx];
            if(t==='api') Object.assign(store.api, p.data);
            else if(t==='user') store.user.prompt = p.data;
            else if(t==='bubble') store.theme.bubbleCss = p.data.bubbleCss || '';
            else if(t==='font') store.theme.fontCss = p.data.fontCss || '';
            else if(t==='icon') store.theme.iconCss = p.data.iconCss || '';
            else Object.assign(store.theme, p.data);
            system.showToast('已加载预设');
        };
        const deletePreset = (t) => {
            const idx = presetSelect[t]; 
            if(idx!==-1 && confirm('删除?')) { store.presets[t].splice(idx,1); saveAll(); presetSelect[t]=-1; } 
        };
        const updatePreset = (t) => {
            const idx = presetSelect[t]; if(idx!==-1) {
                let d = t==='api'?{...store.api}:(t==='user'?store.user.prompt:(t==='bubble'?{bubbleCss:store.theme.bubbleCss}:(t==='font'?{fontCss:store.theme.fontCss}:(t==='icon'?{iconCss:store.theme.iconCss}:{...store.theme}))));
                store.presets[t][idx].data = d;
                saveAll(); system.showToast('已更新');
            }
        };
        const handleGoHome = () => { if(chat.currentChatId.value) chat.exitChat(); else system.goHome(); };
// ==========================================
        // 📸 图片与文件上传相关功能 (补充缺失的厨房做菜逻辑)
        // ==========================================
        const handleImageUpload = (file, callback) => {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsDataURL(file);
        };

        const updateChatAvatar = (e, type) => {
            handleImageUpload(e.target.files[0], (base64) => {
                if (type === 'user') store.user.avatar = base64;
                else if (type === 'role') {
                    if (showEditRoleModal.value) tempEditRole.avatar = base64;
                    else if (chat.showChatDetails.value) chat.editingChat.avatar = base64;
                }
                saveAll();
                system.showToast('头像已更新');
            });
            e.target.value = ''; 
        };

        const sendImage = (e) => {
            handleImageUpload(e.target.files[0], (base64) => {
                chat.pushMsg('user', '', 'image', base64);
            });
            e.target.value = '';
        };

        const addDiaryImage = (e) => {
            handleImageUpload(e.target.files[0], (base64) => {
                diary.diaryImages.value.push(base64);
            });
            e.target.value = '';
        };

// --- 替换起始 ---
        onMounted(() => {
            const wrap = document.getElementById('bubblesWrap');
            if(wrap) {
                for (let i = 0; i < 20; i++) {
                    const b = document.createElement('div');
                    b.className = 'bbl';
                    const size = 20 + Math.random() * 60;
                    b.style.cssText = `width:${size}px; height:${size}px; left:${Math.random()*100}%; bottom:-80px; animation-duration:${15+Math.random()*15}s; animation-delay:${Math.random()*10}s; --dx:${(Math.random()-0.5)*100}px;`;
                    wrap.appendChild(b);
                }
            }
            canvas = document.getElementById('burst-canvas');
            if(canvas) {
                ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                animParticles();
            }
        });
// --- 替换结束 ---
        // 👇 这里是你原来文件里的 return 开始的地方

return {
            store, defaultDogAvatar, defaultCatAvatar,
            ...system, goHome: handleGoHome, ...chat, ...diary, 
            ...period,
            showAddMenu, openAddMenu, closeAddMenu,
            showEditRoleModal, tempEditRole, currentEditIndex, createNewRole, saveEditRole, openEditRole, deleteEditRole, startChatFromContact,
            
            worldCurrentView, expandedRole, worldRoleList, globalWorldBooks, getRoleWorldBooks, goWorldHome, goWorldGlobal, goWorldRole, toggleRoleExpand,
            showWorldMenu, isWorldBatchMode, selectedWorldIds, handleWorldMenu, toggleSelection, deleteSelectedWorlds, createNewWorld, deleteWorldBook, toggleWorldEntry, importWorldFile,
            
            modelList, fetching, fetchModels, presetSelect, presetNameInput, loadPreset, savePreset, deletePreset, updatePreset,
            
            // 下面这行就是刚新加的“美化相关的函数变量”出餐口
            homePage, onHomeTouchStart, onHomeTouchEnd, uploadWidgetImg,themeCurrentView, themeBgUrlInput, handleThemeBgUpload, setThemeBgUrl,restoreThemePresets,clearAllBrowserMemory,
            currentEditIconApp, triggerIconUpload, handleCustomIconUpload, clearAllCustomIcons,
            
            updateChatAvatar, sendImage, addDiaryImage, importCssFile, handleBubblePop,
            importChatHistory:()=>{}, addCustomSticker:()=>{}, importUserPersona:()=>{}, handleStickerFile:()=>{}
        };
    }  // 这是 setup() 的结束括号
}).mount('#app');// 这是最底下的一行