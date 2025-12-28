import { db, collection, query, where, getDocs } from '../firebase-config.js';

export class Chatbot {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.injectStyles();
        this.render();
        this.addEventListeners();
        // Add initial greeting if empty
        if (!this.hasMessages()) {
            this.addBotMessage("Hi! I'm the TukTuk Assistant. 🤖<br>How can I help you today?");
            this.showOptions();
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #tuktuk-chatbot-container {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 9999;
                font-family: 'Inter', sans-serif;
            }
            #chatbot-toggle-btn {
                width: 3.5rem;
                height: 3.5rem;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s;
                border: none;
                color: white;
            }
            #chatbot-toggle-btn:hover {
                transform: scale(1.05);
            }
            #chatbot-window {
                position: absolute;
                bottom: 5rem;
                right: 0;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 1rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform-origin: bottom right;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
                transform: scale(0.9);
                pointer-events: none;
                border: 1px solid rgba(0,0,0,0.1);
            }
            #chatbot-window.open {
                opacity: 1;
                transform: scale(1);
                pointer-events: all;
            }
            .chat-header {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                padding: 1rem;
                color: white;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .chat-messages {
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                background: #f9fafb;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .message {
                max-width: 80%;
                padding: 0.75rem;
                border-radius: 1rem;
                font-size: 0.875rem;
                line-height: 1.4;
                animation: fadeIn 0.3s ease;
            }
            .message.bot {
                background: white;
                border: 1px solid #e5e7eb;
                align-self: flex-start;
                border-bottom-left-radius: 0.25rem;
                color: #1f2937;
            }
            .message.user {
                background: #2563eb;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 0.25rem;
            }
            .chat-input-area {
                padding: 1rem;
                background: white;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 0.5rem;
            }
            .chat-input {
                flex: 1;
                padding: 0.5rem 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 0.5rem;
                outline: none;
                font-size: 0.875rem;
                transition: border-color 0.2s;
            }
            .chat-input:focus {
                border-color: #2563eb;
            }
            .chat-send-btn {
                background: #2563eb;
                color: white;
                border: none;
                width: 2rem;
                height: 2rem;
                border-radius: 0.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-send-btn:hover {
                background: #1d4ed8;
            }
            .quick-options {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-top: 0.5rem;
            }
            .option-btn {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #2563eb;
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.75rem;
                cursor: pointer;
                transition: background 0.2s;
            }
            .option-btn:hover {
                background: #dbeafe;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            /* Dark mode support */
            .dark #chatbot-window {
                background: #1f2937;
                border-color: #374151;
            }
            .dark .chat-messages {
                background: #111827;
            }
            .dark .message.bot {
                background: #1f2937;
                border-color: #374151;
                color: #e5e7eb;
            }
            .dark .chat-input-area {
                background: #1f2937;
                border-color: #374151;
            }
            .dark .chat-input {
                background: #374151;
                border-color: #4b5563;
                color: white;
            }
            .dark .option-btn {
                background: #1e3a8a;
                border-color: #1d4ed8;
                color: #93c5fd;
            }
        `;
        document.head.appendChild(style);
    }

    render() {
        const container = document.createElement('div');
        container.id = 'tuktuk-chatbot-container';
        container.innerHTML = `
            <div id="chatbot-window">
                <div class="chat-header">
                    <div style="background: rgba(255,255,255,0.2); p-1; border-radius: 50%; display: flex; align-items:center; justify-content:center; width: 32px; height: 32px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: 1rem; font-weight: 600;">TukTuk Support</h3>
                        <span style="font-size: 0.75rem; opacity: 0.9;">Online</span>
                    </div>
                    <button id="chatbot-close" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; opacity: 0.8;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <!-- Messages go here -->
                </div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off">
                    <button class="chat-send-btn" id="chat-send">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </div>
            </div>
            <button id="chatbot-toggle-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
        `;
        document.body.appendChild(container);
    }

    addEventListeners() {
        this.toggleBtn = document.getElementById('chatbot-toggle-btn');
        this.window = document.getElementById('chatbot-window');
        this.closeBtn = document.getElementById('chatbot-close');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send');
        this.messagesContainer = document.getElementById('chat-messages');

        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.toggle());

        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });

        // Event delegation for option buttons
        this.messagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                const action = e.target.dataset.action;
                const label = e.target.textContent;
                this.addUserMessage(label);
                this.processAction(action);
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.window.classList.add('open');
            this.input.focus();
        } else {
            this.window.classList.remove('open');
        }
    }

    hasMessages() {
        return this.messagesContainer.children.length > 0;
    }

    addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user';
        div.innerText = text;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    addBotMessage(html, options = []) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = html;

        if (options.length > 0) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quick-options';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt.label;
                btn.dataset.action = opt.action;
                optionsDiv.appendChild(btn);
            });
            div.appendChild(optionsDiv);
        }

        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        this.addUserMessage(text);
        this.input.value = '';

        // Show typing indicator via simple timeout
        setTimeout(() => this.processInput(text), 500);
    }

    processAction(action) {
        setTimeout(() => {
            switch (action) {
                case 'track_menu':
                    this.addBotMessage("Please enter the <b>Tracking ID</b> (e.g., TUK-0001).");
                    break;
                case 'price_menu':
                    this.addBotMessage("Our standard pricing is <b>₹10/km</b>.<br>For a precise quote including weight and lot size, please use the 'Request Shipment' page.", [
                        { label: "Go to Request", action: "goto_request" }
                    ]);
                    break;
                case 'goto_request':
                    window.location.href = 'request.html';
                    break;
                case 'contact_menu':
                    this.addBotMessage("You can reach us at:<br>📧 support@tuktuktrack.com<br>📞 +91 987 654 3210");
                    break;
                case 'show_menu':
                    this.showOptions();
                    break;
            }
        }, 500);
    }

    async processInput(text) {
        const lowerText = text.toLowerCase();

        // 1. HELP / MENU
        if (lowerText.includes('help') || lowerText.includes('menu') || lowerText.includes('hi') || lowerText.includes('hello')) {
            this.showOptions();
            return;
        }

        // 2. PRICING
        if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('rate')) {
            this.processAction('price_menu');
            return;
        }

        // 3. TRACKING - Regex for TUK-XXXX or similar
        const trackMatch = text.match(/TUK-\d{4,}/i) || text.match(/^track\s+(.+)/i);

        if (trackMatch) {
            const id = trackMatch[0].toUpperCase();
            this.addBotMessage(`Searching for shipment <b>${id}</b>... 🔍`);
            await this.trackShipment(id);
            return;
        }

        // Fallback for just "track"
        if (lowerText.includes('track')) {
            this.processAction('track_menu');
            return;
        }

        // 4. Fallback
        this.addBotMessage("I'm not sure I understand efficiently. 🤔<br>Try selecting an option below:", [
            { label: "Track Shipment", action: "track_menu" },
            { label: "Pricing", action: "price_menu" },
            { label: "Help", action: "show_menu" }
        ]);
    }

    showOptions() {
        this.addBotMessage("What can I help you with?", [
            { label: "Track Shipment 🚚", action: "track_menu" },
            { label: "Check Pricing 💰", action: "price_menu" },
            { label: "Contact Support 📞", action: "contact_menu" }
        ]);
    }

    async trackShipment(trackingId) {
        try {
            // Check direct ID or query
            let shipmentData = null;

            // Try query first as it's the public tracking ID usually
            const q = query(collection(db, "shipments"), where("trackingId", "==", trackingId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                shipmentData = querySnapshot.docs[0].data();
            }

            if (shipmentData) {
                const status = shipmentData.status || "Unknown";
                const loc = shipmentData.currentLocation ? "Active Location" : (shipmentData.pickup ? shipmentData.pickup.place : "Origin");
                let timeStr = "";

                // Try to get ETA
                if (shipmentData.status === 'In Transit' && document.getElementById('eta-display')) {
                    // If we happen to be on the tracking page, grab the calculated ETA
                    timeStr = "<br>ETA: " + document.getElementById('eta-display').innerText;
                }

                let reply = `Found it! 🎉<br><br><b>Status:</b> ${status}<br><b>Current:</b> ${loc}`;

                if (shipmentData.delivery && shipmentData.delivery.date) {
                    const d = new Date(shipmentData.delivery.date);
                    reply += `<br><b>Scheduled:</b> ${d.toLocaleDateString()}`;
                }

                this.addBotMessage(reply, [
                    { label: "View Details", action: "goto_track_page_" + trackingId }
                ]);

                // Handle dynamic action redirect
                this.messagesContainer.lastElementChild.querySelector('button[data-action^="goto_track_page"]').onclick = () => {
                    window.location.href = `track.html?id=${trackingId}`;
                };

            } else {
                this.addBotMessage(`I couldn't find any shipment with ID <b>${trackingId}</b>. Please check and try again.`);
            }

        } catch (error) {
            console.error("Chatbot Tracking Error:", error);
            this.addBotMessage("Sorry, I encountered an error while searching. Please try again later.");
        }
    }
}

// Auto-initialize when imported
new Chatbot();
