const { ref, reactive, computed, nextTick } = Vue;
import { store, saveAll } from '../store.js';
import { defaultDogAvatar, parseTavernPng } from '../utils.js';

export function useChat(system) {
    const currentChatId = ref(null);
    const inputText = ref('');
    const chatBox = ref(null);
    const isLoading = ref(false);
    const swipedChatId = ref(null);
    const touchStartX = ref(0);
    
    // 编辑模式
    const isEditMode = ref(false); 
    const toggleEditMode = () => {
        isEditMode.value = !isEditMode.value;
        swipedChatId.value = null;
    };
    
    // UI 状态
    const showRoleOptionModal = ref(false);
    const showChatDetails = ref(false);
    const editingChat = reactive({});
    const showRedPacketModal = ref(false);
    const rpAmount = ref('');
    const rpNote = ref('');
    const showChatEmoji = ref(false);
    const emojiTab = ref('default');
    const defaultEmojis = ['😀','😂','🥰','😎','🤔','😭','😡','👍'];

    // 计算属性
    const currentChatData = computed(() => store.activeChats.find(c => c.id === currentChatId.value) || { messages:[] });
    const sortedActiveChats = computed(() => {
        return [...store.activeChats].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.id - a.id;
        });
    });

    const scrollToBottom = () => { if(chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight; };
    
    const enterChat = (id) => {
        if (isEditMode.value) return; 
        if (swipedChatId.value === id) { swipedChatId.value = null; return; }
        swipedChatId.value = null; currentChatId.value = id; nextTick(scrollToBottom);
    };

    const pushMsg = (role, content, type, image) => {
        const msg = { role, content, type, image };
        currentChatData.value.messages.push(msg);
        if(role!=='system') {
            currentChatData.value.lastMsg = content || (type==='redpacket'?'[红包]':'[图片]');
            const date = new Date();
            currentChatData.value.lastTime = date.getHours().toString().padStart(2,'0') + ':' + date.getMinutes().toString().padStart(2,'0');
        }
        nextTick(scrollToBottom); saveAll();
    };

    const sendText = () => {
        if(!inputText.value.trim()) return;
        pushMsg('user', inputText.value.trim());
        inputText.value = '';
    };

    // === [自动诊断版] AI 回复逻辑 ===
    const triggerAiReply = async () => {
        if(!store.api.key) return system.showToast('未配置 API Key', 'error');
        
        isLoading.value = true; 
        nextTick(scrollToBottom);
        
        try {
            let baseUrl = (store.api.baseUrl || '').trim();
            // 0. 基础检查
            if (!baseUrl) throw new Error("API 地址为空，请在设置中填写");
            if (!baseUrl.startsWith('http')) throw new Error("地址必须以 http:// 或 https:// 开头");

            const requestUrl = `${baseUrl.replace(/\/+$/,'')}/chat/completions`;
            
            // 1. 发起请求
            const msgs = [
                {role:'system', content: currentChatData.value.prompt || 'Roleplay.'}, 
                ...currentChatData.value.messages.slice(-50).map(x=>({role:x.role, content:x.content}))
            ];
            
            const res = await fetch(requestUrl, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${store.api.key}` 
                },
                body: JSON.stringify({ 
                    model: store.api.model, 
                    messages: msgs, 
                    max_tokens: 300, 
                    temperature: 0.8 
                })
            });

            // 2. HTTP 状态码诊断 (连上了，但被拒了)
            if (!res.ok) {
                const errData = await res.json().catch(() => ({})); 
                const apiMsg = errData.error ? errData.error.message : '无详细信息';
                
                let reason = "";
                if (res.status === 401) reason = "🔑 密钥错误 (401)\n检查 API Key 是否填错或过期。";
                else if (res.status === 403) reason = "🚫 拒绝访问 (403)\n账号可能被封禁，或该节点不支持访问。";
                else if (res.status === 404) reason = "🔍 路径错误 (404)\n检查反代地址是否正确，或者模型名称不存在。";
                else if (res.status === 429) reason = "💰 额度不足 (429)\n账号没余额了，或者请求太频繁。";
                else if (res.status >= 500) reason = "🔥 服务端崩溃 (5xx)\n服务商服务器出问题了。";
                else reason = `⚠️ 未知错误 (${res.status})`;
                
                throw new Error(`${reason}\n\n📝 服务端返回: ${apiMsg}`);
            }

            const data = await res.json();
            if(data.error) throw new Error(`API返回错误: ${data.error.message}`);
            
            pushMsg('assistant', data.choices[0].message.content);

        } catch(e) { 
            let errorMsg = e.message;

            // 3. 网络错误自动诊断 (最常见的问题)
            if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
                const url = store.api.baseUrl;
                
                // 侦探逻辑：根据 URL 特征猜测原因
                let guess = "";
                
                if (url.includes('api.openai.com')) {
                    guess = "❌ **官方地址不可直连**\n浏览器安全机制禁止网页直接访问 api.openai.com。\n✅ **解决方法**：请使用第三方中转(反代)地址。";
                } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
                    guess = "❌ **本地服务跨域拦截**\n你连接的是本地服务，但对方没有允许网页访问(CORS)。\n✅ **解决方法**：如果是 Ollama，请设置环境变量 OLLAMA_ORIGINS=\"*\"。";
                } else if (url.startsWith('https://')) {
                    guess = "❌ **SSL/网络/跨域问题**\n可能原因：\n1. 你的代理(梯子)没开或节点不通。\n2. 对方服务器不支持跨域访问(CORS)。\n3. 域名拼写错误。";
                } else {
                    guess = "❌ **网络连接失败**\n请检查地址是否拼写正确，或检查你的网络设置。";
                }

                errorMsg = `🛑 **连接失败 (Failed to fetch)**\n\n${guess}\n\n🔗 目标地址: ${url}`;
            }

            pushMsg('assistant', errorMsg); 
            console.error("AI请求失败:", e);
            system.showToast('请求失败', 'error');
        } finally { 
            isLoading.value = false; 
            nextTick(scrollToBottom); 
            saveAll(); 
        }
    };

    const handleChatTouchStart = (e) => { touchStartX.value = e.touches[0].clientX; };
    const handleChatTouchEnd = (e, chatId) => {
        const diff = touchStartX.value - e.changedTouches[0].clientX;
        if (diff > 50) swipedChatId.value = chatId;
    };
    const deleteChatSession = (id) => {
        if(confirm('确定删除此条对话记录吗？')) {
            store.activeChats = store.activeChats.filter(c => c.id !== id);
            if(currentChatId.value === id) currentChatId.value = null;
            saveAll();
        }
    };
    const togglePinChat = (chat) => { chat.isPinned = !chat.isPinned; swipedChatId.value = null; saveAll(); };
    const sendRedPacket = () => {
        if(!rpAmount.value) return system.showToast('请输入金额', 'error');
        pushMsg('user', `${rpAmount.value}\n${rpNote.value || '恭喜发财'}`, 'redpacket');
        showRedPacketModal.value = false;
    };

    // 角色卡解析
    const processCardData = (data, avatarSrc) => {
        const charData = data.data || data; 
        const name = charData.name || charData.char_name || "未知角色";
        let prompt = "";
        if (charData.description) prompt += `[Character("${name}")]\n[Description("${charData.description}")]\n`;
        if (charData.personality) prompt += `[Personality("${charData.personality}")]\n`;
        if (charData.scenario) prompt += `[Scenario("${charData.scenario}")]\n`;
        if (charData.mes_example) prompt += `[Example Dialogue]\n${charData.mes_example}\n`;
        if (!prompt && charData.char_persona) prompt = charData.char_persona;

        let worldBookCount = 0;
        if (charData.character_book && charData.character_book.entries) {
            charData.character_book.entries.forEach(entry => {
                store.worldList.push({
                    id: Date.now() + Math.random(),
                    name: entry.comment || entry.keys[0] || '未命名条目',
                    keys: entry.keys.join(', '),
                    content: entry.content,
                    type: 'role', roleName: name, enabled: entry.enabled, expanded: false
                });
                worldBookCount++;
            });
        }
        store.roleList.push({ name, status: '导入角色', prompt: prompt, avatar: avatarSrc, firstMsg: charData.first_mes || "" });
        saveAll();
        let msg = `已导入: ${name}`;
        if (worldBookCount > 0) msg += ` (+${worldBookCount} 世界书)`;
        system.showToast(msg);
    };

    const importCharacterCard = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try { processCardData(JSON.parse(e.target.result), defaultDogAvatar); } 
                    catch (err) { system.showToast('JSON 格式错误', 'error'); }
                };
                reader.readAsText(file);
            } else if (file.name.toLowerCase().endsWith('.png')) {
                const imgReader = new FileReader();
                imgReader.onload = async (e) => {
                    const avatarSrc = e.target.result;
                    try {
                        const cardData = await parseTavernPng(file);
                        processCardData(cardData, avatarSrc);
                    } catch (parseErr) {
                        console.warn("PNG解析失败", parseErr);
                        const simpleName = file.name.replace(/\.png$/i, '');
                        store.roleList.push({ name: simpleName, status: '图片导入', prompt: '', avatar: avatarSrc });
                        saveAll();
                        system.showToast(`已导入图片: ${simpleName}`, 'info');
                    }
                };
                imgReader.readAsDataURL(file);
            }
        } catch (e) { console.error(e); system.showToast('导入失败', 'error'); }
        event.target.value = '';
    };

    const addNewChatInEditMode = () => {
        system.activeTab.value = 1; 
        system.showToast('请在通讯录选择角色发起聊天');
        isEditMode.value = false;
    };

    return {
        currentChatId, inputText, chatBox, isLoading, swipedChatId, showRoleOptionModal,
        showChatDetails, editingChat, showRedPacketModal, rpAmount, rpNote,
        showChatEmoji, emojiTab, defaultEmojis,
        currentChatData, sortedActiveChats,
        enterChat, pushMsg, sendText, triggerAiReply, handleChatTouchStart, handleChatTouchEnd,
        deleteChatSession, togglePinChat, sendRedPacket,
        isEditMode, toggleEditMode, importCharacterCard, addNewChatInEditMode,
        exitChat: () => currentChatId.value = null,
        openChatSettings: () => { Object.assign(editingChat, currentChatData.value); showChatDetails.value = true; },
        saveSettings: () => { Object.assign(currentChatData.value, editingChat); saveAll(); system.showToast('设置保存'); showChatDetails.value=false; },
        previewImage: (src) => { const w=window.open('about:blank'); w.document.write(`<img src="${src}" style="width:100%">`); },
        sendSticker: (s) => pushMsg('user', '', 'image', s),
        createNewStickerGroup:()=>{}, deleteStickerGroup:()=>{}, openStickerUploadMenu:()=>{}, clearHistory:()=>{}, exportChatHistory:()=>{}, triggerManualSummary:()=>{}, handleStickerMenuAction:()=>{}
    };
}