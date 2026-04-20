// 生成随机 ID
export const getUUID = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// 格式化日期
export const formatDate = (date) => {
    return (date.getMonth()+1) + ' 月 ' + date.getDate() + '日';
};

// === 1. 定义新头像 (SVG 矢量绘图) ===

// 可爱小狼头 (AI 默认)
export const defaultDogAvatar = `data:image/svg+xml;utf8,
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="%23e2e8f0"/>
  <path d="M20,30 L10,10 L40,25 Z" fill="%2394a3b8"/>
  <path d="M80,30 L90,10 L60,25 Z" fill="%2394a3b8"/>
  <circle cx="50" cy="55" r="35" fill="%23cbd5e1"/>
  <circle cx="35" cy="50" r="4" fill="%23334155"/>
  <circle cx="65" cy="50" r="4" fill="%23334155"/>
  <ellipse cx="50" cy="65" rx="12" ry="10" fill="white"/>
  <path d="M46,62 L54,62 L50,68 Z" fill="%23334155"/>
  <path d="M50,68 L50,72 M45,70 Q50,75 55,70" stroke="%23334155" stroke-width="2" fill="none"/>
  <circle cx="25" cy="60" r="5" fill="%23fecaca" opacity="0.6"/>
  <circle cx="75" cy="60" r="5" fill="%23fecaca" opacity="0.6"/>
</svg>`;

// 可爱小猫头 (用户 默认)
export const defaultCatAvatar = `data:image/svg+xml;utf8,
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="%23ffedd5"/>
  <path d="M25,35 L15,15 L45,25 Z" fill="%23fb923c"/>
  <path d="M75,35 L85,15 L55,25 Z" fill="%23fb923c"/>
  <circle cx="50" cy="55" r="32" fill="%23fdba74"/>
  <circle cx="38" cy="52" r="3" fill="black"/>
  <circle cx="62" cy="52" r="3" fill="black"/>
  <path d="M48,60 L52,60 L50,63 Z" fill="%23be123c"/>
  <path d="M50,63 Q45,68 40,63 M50,63 Q55,68 60,63" stroke="black" stroke-width="2" fill="none"/>
  <line x1="20" y1="55" x2="35" y2="58" stroke="white" stroke-width="2"/>
  <line x1="20" y1="62" x2="35" y2="60" stroke="white" stroke-width="2"/>
  <line x1="80" y1="55" x2="65" y2="58" stroke="white" stroke-width="2"/>
  <line x1="80" y1="62" x2="65" y2="60" stroke="white" stroke-width="2"/>
</svg>`;


// === 2. 角色卡解析工具 (已修复乱码问题) ===

// 辅助：解码带中文的 Base64 字符串
const decodeBase64UTF8 = (base64Str) => {
    try {
        // 1. 将 Base64 还原为二进制字符串
        const binaryString = atob(base64Str);
        // 2. 将二进制字符串转换为字节数组 (Uint8Array)
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        // 3. 用 TextDecoder 按照 UTF-8 解码字节数组
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error("Base64 decode error:", e);
        return null;
    }
};

// 解析 PNG 中的 tEXt 块
export const parseTavernPng = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const buffer = event.target.result;
                const view = new DataView(buffer);
                let offset = 8; // 跳过 PNG 文件头

                while (offset < view.byteLength) {
                    // 读取 Chunk 长度和类型
                    const length = view.getUint32(offset);
                    const type = String.fromCharCode(
                        view.getUint8(offset + 4), view.getUint8(offset + 5),
                        view.getUint8(offset + 6), view.getUint8(offset + 7)
                    );

                    if (type === 'tEXt') {
                        let dataOffset = offset + 8;
                        // 寻找关键字结束的 null 分隔符 (0x00)
                        let keywordEnd = dataOffset;
                        while (keywordEnd < dataOffset + length && view.getUint8(keywordEnd) !== 0) {
                            keywordEnd++;
                        }

                        // 读取关键字 (例如 "chara")
                        const keywordBytes = new Uint8Array(buffer, dataOffset, keywordEnd - dataOffset);
                        const keyword = new TextDecoder('utf-8').decode(keywordBytes);

                        if (keyword === 'chara') {
                            // 读取内容 (Base64 字符串)
                            const contentStart = keywordEnd + 1; // 跳过 null
                            const contentLength = (dataOffset + length) - contentStart;
                            const contentBytes = new Uint8Array(buffer, contentStart, contentLength);
                            const base64Content = new TextDecoder('utf-8').decode(contentBytes);

                            // 解码 Base64 内容
                            const jsonStr = decodeBase64UTF8(base64Content);
                            if (jsonStr) {
                                resolve(JSON.parse(jsonStr));
                                return;
                            }
                        }
                    }
                    // 移动到下一个 Chunk (长度 + 类型4 + 数据 + CRC4)
                    offset += 12 + length; 
                }
                reject('未在图片中找到角色数据 (tEXt chunk)');
            } catch (e) {
                reject(e);
            }
        };
        // 必须用 ArrayBuffer 读取才能处理二进制流
        reader.readAsArrayBuffer(file);
    });
};