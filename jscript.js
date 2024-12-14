const apiKey = 'AIzaSyBujsVZEGtpvLdnbKTrkokB7_kkmLHjSdo';  // ใช้ API Key ที่ได้จาก Google Developer Console
const videoId = '82OSsAriiB0';  // ID ของวิดีโอ YouTube ที่คุณต้องการดึงแชทสด

let lastChatTimestamp = null;  // ใช้ตัวแปรนี้เก็บ timestamp ของแชทล่าสุด

async function fetchLiveChatId() {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`);
  const data = await response.json();
  
  if (data.items && data.items.length > 0 && data.items[0].liveStreamingDetails) {
    const liveChatId = data.items[0].liveStreamingDetails.activeLiveChatId;
    return liveChatId;
  } else {
    throw new Error('ไม่พบ Live Chat ID สำหรับวิดีโอนี้');
  }
}

async function fetchLiveChatMessages(liveChatId) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${apiKey}`);
  const data = await response.json();
  
  if (data.items && data.items.length > 0) {
    const chatContainer = document.getElementById("chat-messages");

    data.items.forEach(item => {
      const messageTime = new Date(item.snippet.publishedAt).getTime();  // เก็บเวลาเป็น timestamp

      // เช็คว่าแชทนี้ใหม่หรือไม่
      if (!lastChatTimestamp || messageTime > lastChatTimestamp) {
        const author = item.authorDetails.displayName;
        const text = item.snippet.displayMessage;
        
        // สร้าง HTML สำหรับข้อความแชท
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message');
        
        const authorElement = document.createElement('span');
        authorElement.classList.add('chat-author');
        authorElement.innerText = `${author}: `;
        
        const textElement = document.createElement('span');
        textElement.classList.add('chat-text');
        textElement.innerText = text;

        chatMessage.appendChild(authorElement);
        chatMessage.appendChild(textElement);

        chatContainer.appendChild(chatMessage);

        lastChatTimestamp = messageTime;  // อัปเดตเวลาแชทล่าสุด
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("กำลังดึง Live Chat ID...");
    const liveChatId = await fetchLiveChatId();
    console.log("Live Chat ID:", liveChatId);

    setInterval(() => {
      console.log("กำลังดึงข้อความแชท...");
      fetchLiveChatMessages(liveChatId);
    }, 2000); // ดึงข้อความแชททุกๆ 2 วินาที

    // สร้าง MutationObserver เพื่อให้แชทเลื่อนลงทุกครั้งที่มีข้อความใหม่
    const chatContainer = document.getElementById("chat-messages");

    const observer = new MutationObserver(() => {
      // ตรวจสอบว่าแชทอยู่ที่ด้านล่างสุดหรือไม่
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
      
      // เลื่อนแชทไปที่ด้านล่างสุดถ้าผู้ใช้ไม่ได้เลื่อนขึ้นไปดูแชทเก่า
      if (isScrolledToBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });

    // เริ่มติดตามการเปลี่ยนแปลงใน #chat-messages
    observer.observe(chatContainer, { childList: true, subtree: true });

  } catch (error) {
    console.error("Error fetching live chat:", error);
  }
});
