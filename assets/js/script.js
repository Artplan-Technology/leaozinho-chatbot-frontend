 class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.mainContent = document.getElementById('main-content'); // O ID foi adicionado ao <main> no HTML
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.validationAlert = document.getElementById('validationAlert');
        this.contextualSuggestions = document.getElementById('contextualSuggestions');
        this.emptyState = document.getElementById('emptyState');
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
        
        this.webhookUrl = 'https://n8n.srv871883.hstgr.cloud/webhook-test/28aa3a9b-633e-4264-888c-ca52626663cb';
        this.isTyping = false;
        this.sessionID = this.getSessionID();
        this.messageCount = 0;
        
        // Keywords válidas
        this.validKeywords = [
            'cliente', 'campanha', 'mídia', 'midia', 'performance', 'roi', 'cpa',
            'conversão', 'conversao', 'jogo', 'partida', 'jogos', 'plano', 'orçamento', 
            'orcamento', 'métrica', 'metrica', 'ga4', 'cpc', 'cpm', 'clique', 'impressão',
            'impressao', 'budget', 'dados', 'calendário', 'calendario', 'campeonato',
            'futebol', 'esporte', 'taxa', 'custo', 'semana', 'período', 'periodo',
            'tv', 'rádio', 'radio', 'ooh', 'veiculação', 'veiculacao', 'inserção', 'insercao',
            'alcance', 'vendas', 'conversões', 'conversoes', 'receita', 'tráfego', 'trafego'
        ];
        
        // Sugestões por intent
        this.suggestionsByIntent = {
            ga4_metrics: {
                items: [
                    'CPA por campanha específica',
                    'Conversões por canal',
                    'Taxa de conversão por device',
                    'Usuários novos vs retornantes',
                    'Receita média por sessão'
                ]
            },
            ga4_7days: {
                items: [
                    'Comparar com semana anterior',
                    'Top 5 campanhas',
                    'Maior dia de tráfego',
                    'CPA por canal',
                    'Performance por horário'
                ]
            },
            media_plan: {
                items: [
                    'Sugestão de orçamento',
                    'Melhor período para veicular',
                    'Veículos recomendados',
                    'Alcance por praça',
                    'Frequência recomendada'
                ]
            },
            sports_events: {
                items: [
                    'Próximos jogos',
                    'Resultados recentes',
                    'Calendário do mês',
                    'Campeonatos principais',
                    'Ranking atualizado'
                ]
            },
            default: {
                items: [
                    'Métricas GA4',
                    'Plano de Mídias',
                    'Calendário de Jogos',
                    'Falar com um humano'
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTextareaAutoResize();
    }
    
    setupEventListeners() {
        
      this.toggleSidebarBtn.addEventListener('click', () => {
            this.sidebar.classList.toggle('collapsed');

            // Se sidebar está aberta, adiciona classe no main-content
            if (!this.sidebar.classList.contains('collapsed')) {
                this.mainContent.classList.add('shifted');
            } else {
                this.mainContent.classList.remove('shifted');
            }
        });


        if (window.innerWidth <= 768) {
            this.sidebar.classList.add('collapsed');
        }
        
        
        // Envio por botão
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Envio por Enter (Shift+Enter = nova linha)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Atualizar estado do botão
        this.messageInput.addEventListener('input', () => {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText || this.isTyping;
        });
        
        // Quick buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const intent = btn.dataset.intent;
                if (intent) {
                    this.disableQuickButtons();
                    this.sendMessage({ text: '', intent });
                }
            });
        });
        
        // Nova conversa
        // document.getElementById('newChatBtn').addEventListener('click', () => {
        //     this.newConversation();
        // });
        
        this.scopeSelect = document.getElementById('scopeSelect');
    }
    
    setupTextareaAutoResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
    }
    
    getSessionID() {
        let sessionID = sessionStorage.getItem('chatbotSessionID');
        if (!sessionID) {
            sessionID = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            sessionStorage.setItem('chatbotSessionID', sessionID);
        }
        return sessionID;
    }
    
    isValidQuestion(text, intent) {
        if (intent) return true;
        if (!text || text.trim().length === 0) return false;
        
        const hasKeyword = this.validKeywords.some(kw => 
            text.toLowerCase().includes(kw)
        );
        
        return hasKeyword;
    }
    
    showValidationAlert(message) {
        this.validationAlert.textContent = message;
        this.validationAlert.classList.add('show');
        setTimeout(() => {
            this.validationAlert.classList.remove('show');
        }, 4000);
    }
    
    disableQuickButtons() {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.disabled = true;
        });
    }
    
    enableQuickButtons() {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.disabled = false;
        });
    }
    
    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
    }
    
    newConversation() {
        this.chatMessages.innerHTML = '';
        this.emptyState.style.display = 'flex';
        this.contextualSuggestions.classList.remove('show');
        this.messageCount = 0;
        this.sessionID = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('chatbotSessionID', this.sessionID);
    }
    
    suggestIntentFromText(text) {
        if (!text) return null;
        const t = text.toLowerCase();
        
        const mapping = {
            ga4_metrics: ['cpa','conversão','conversao','métrica','metrica','ga4','taxa','custo por','roi'],
            ga4_7days: ['últimos 7','7 dias','7d','semana','última semana','ultima semana'],
            media_plan: ['plano','mídia','midia','planejamento','planejar','orçamento','orcamento','budget','investimento'],
            sports_events: ['jogo','jogos','partida','calendário','calendario','futebol','esporte','campeonato']
        };
        
        for (const key in mapping) {
            for (const kw of mapping[key]) {
                if (t.includes(kw)) return key;
            }
        }
        return null;
    }
    
    renderSuggestions(intent, items = null) {
        this.contextualSuggestions.innerHTML = '';
        
        if (!items) {
            const suggestionData = this.suggestionsByIntent[intent] || this.suggestionsByIntent.default;
            items = suggestionData.items;
        }
        
        if (!items || items.length === 0) {
            this.contextualSuggestions.classList.remove('show');
            return;
        }
        
        const limitedItems = items.slice(0, 5);
        
        limitedItems.forEach(text => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = text;
            
            chip.addEventListener('click', () => {
                this.messageInput.value = text;
                this.messageInput.focus();
                this.messageInput.dispatchEvent(new Event('input'));
            });
            
            this.contextualSuggestions.appendChild(chip);
        });
        
        this.contextualSuggestions.classList.add('show');
    }
    
    getMockResponse(intent, question) {
        const mockDatabase = {
            ga4_metrics: {
                reply: "📊 **Métricas GA4 - Última Semana**\n\n" +
                "**CPA:** R$ 45,50\n" +
                "**Conversões:** 1.250\n" +
                "**Tráfego:** 45.000 sessões\n" +
                "**Taxa de Conversão:** 2,78%\n" +
                "**ROI:** 3,2x\n\n" +
                "_Fonte dos dados: GA4_",
                intent: 'leao-gestor',
                suggestions: [
                    'CPA por campanha específica',
                    'Comparar conversões por canal',
                    'Taxa de conversão por device',
                    'Usuários novos vs retornantes',
                    'Receita média por sessão'
                ]
            },
            ga4_7days: {
                reply: "📈 **Performance - Últimos 7 Dias**\n\n" +
                "**Dia com maior CPA:** 3ª-feira (R$ 52,30)\n" +
                "**Dia com menor CPA:** Sábado (R$ 38,10)\n" +
                "**Tendência:** Queda de 8% vs semana anterior\n" +
                "**Top 3 Campanhas:**\n" +
                "1. Google Ads - R$ 42,00\n" +
                "2. Meta Ads - R$ 48,50\n" +
                "3. Programático - R$ 51,20\n\n" +
                "_Comparação realizada com sucesso_",
                intent: 'leao-gestor',
                suggestions: [
                    'Comparar com semana anterior',
                    'Dia com melhor performance',
                    'Top 5 campanhas por conversão',
                    'Tendência de CPA (semanal)',
                    'Performance por horário'
                ]
            },
            media_plan: {
                reply: "🎯 **Plano de Mídias - Recomendação**\n\n" +
                "**Orçamento Sugerido:** R$ 50.000\n" +
                "**Melhor Mix:**\n" +
                "- TV (45%) - Alcance: 2M\n" +
                "- OOH (35%) - Impacto: 850K\n" +
                "- Rádio (20%) - Frequência: 8x\n\n" +
                "**Período Recomendado:** 15 dias\n" +
                "**ROI Projetado:** 2,8x\n\n" +
                "_Análise baseada em histórico de campanhas similares_",
                intent: 'leao-midias',
                suggestions: [
                    'Sugestão de orçamento para próximo mês',
                    'Melhor combinação de mídias',
                    'Alcance por praça',
                    'Frequência recomendada',
                    'ROI projetado por veículo'
                ]
            },
            sports_events: {
                reply: "⚽ **Próximos Jogos - Fim de Semana**\n\n" +
                "**Sábado, 20 de Jan**\n" +
                "- Flamengo x Botafogo - 18:00\n" +
                "- São Paulo x Corinthians - 20:30\n\n" +
                "**Domingo, 21 de Jan**\n" +
                "- Palmeiras x Santos - 18:00\n" +
                "- Vasco x Atlético-MG - 20:30\n\n" +
                "**Campeonato:** Brasileirão Série A",
                intent: 'leao-esportes',
                suggestions: [
                    'Próximos jogos',
                    'Resultados recentes',
                    'Calendário do mês',
                    'Campeonatos principais',
                    'Ranking atualizado'
                ]
            }
        };
        
        return mockDatabase[intent] || {
            reply: "🦁 Desculpa, não entendi bem. Tente outra pergunta!",
            intent: 'error',
            suggestions: ['Métricas GA4', 'Plano de Mídias', 'Jogos/Calendário']
        };
    }
    
    async sendToWebhook(message) {
        const USE_MOCK = false; // Mude para false quando conectar ao N8N
        
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const intent = message.intent || 'ga4_metrics';
            return this.getMockResponse(intent, message.question);
        }
        
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: message,
                    sessionID: this.sessionID
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const textData = await response.text();
                return { reply: textData };
            }
        } catch (error) {
            console.error('Erro na requisição para webhook:', error);
            throw error;
        }
    }
    
    async sendMessage(payload = null) {
        let message = '';
        let intent = null;
        
        if (payload && payload.intent) {
            intent = payload.intent;
            message = payload.text || '';
        } else {
            message = this.messageInput.value.trim();
            const suggested = this.suggestIntentFromText(message);
            if (suggested) {
                intent = suggested;
            }
        }
        
        if (!this.isValidQuestion(message, intent)) {
            this.showValidationAlert('📌 Pergunta muito genérica. Pergunte sobre GA4, Plano de Mídias ou Jogos!');
            return;
        }
        
        if (message.length > 600) {
            this.showValidationAlert('📝 Pergunta muito longa (máximo 600 caracteres)');
            return;
        }
        
        if (this.isTyping) return;
        
        this.hideEmptyState();
        this.messageCount++;
        
        if (message) {
            this.addUserMessage(message);
        } else if (intent) {
            this.addUserMessage(this.intentLabel(intent));
        }
        
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendButton.disabled = true;
        this.isTyping = true;
        this.contextualSuggestions.classList.remove('show');
        this.showTypingIndicator();
        
        try {
            const body = {
                question: message || '',
                intent: intent || null,
                scope: this.scopeSelect ? this.scopeSelect.value : 'ga4',
                sessionID: this.sessionID
            };
            
            const response = await this.sendToWebhook(body);
            this.hideTypingIndicator();
            
            if (response && (response.reply || response.output)) {
                const botText = response.reply || response.output;
                
                await this.addBotMessage(botText, {
                    intent: response.intent || intent,
                    lastQuestion: message,
                    customSuggestions: response.suggestions || null
                });
                
            } else if (response && response.intent === 'out_of_scope') {
                await this.addBotMessage(
                    "🦁 Desculpa — parece que sua pergunta está fora do meu contexto. Posso ajudar com: Métricas GA4, Plano de Mídias, Jogos/Calendário.",
                    {
                        intent: 'error',
                        customSuggestions: ['Métricas GA4', 'Plano de Mídias', 'Jogos/Calendário']
                    }
                );
            } else {
                await this.addBotMessage(
                    "🦁 Hmm... Algo deu errado! Tente novamente.",
                    {
                        intent: 'error',
                        customSuggestions: ['Tentar novamente']
                    }
                );
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.hideTypingIndicator();
            await this.addBotMessage(
                "Ops! Problema na conexão. Tente de novo.",
                {
                    intent: 'error',
                    customSuggestions: ['Tentar novamente', 'Falar com um humano']
                }
            );
        } finally {
            this.isTyping = false;
            this.sendButton.disabled = false;
            this.enableQuickButtons();
            this.messageInput.focus();
        }
    }
    
    intentLabel(intentKey) {
        const labels = {
            ga4_metrics: 'Métricas GA4',
            ga4_7days: 'GA4 (Últ. 7 dias)',
            media_plan: 'Plano de Mídias',
            sports_events: 'Jogos/Calendário',
        };
        return labels[intentKey] || intentKey;
    }
    
    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    async addBotMessage(message, intentData = null) {
        const messageElement = this.createMessageElement('', 'bot');
        const messageContent = messageElement.querySelector('.message-content');
        
        const html = DOMPurify.sanitize(marked.parse(message));
        messageContent.innerHTML = html;
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        if (intentData) {
            if (intentData.customSuggestions && Array.isArray(intentData.customSuggestions)) {
                this.renderSuggestions(intentData.intent, intentData.customSuggestions);
            } else {
                this.renderSuggestions(intentData.intent);
            }
        }
    }
    
    createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (type === 'bot') {
            const img = document.createElement('img');
            img.src = './assets/img/logo-llittle-lion.png';
            img.alt = 'Leãozinho';
            img.style.width = '28px';      // ajuste conforme o layout
            img.style.height = '28px';
            img.style.borderRadius = '50%'; // opcional, deixa redondo
            img.style.objectFit = 'cover';  // garante que não distorça
            avatar.appendChild(img);
        } else {
            avatar.textContent = '👤';
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'message-content-wrapper';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        
        wrapper.appendChild(contentDiv);
        wrapper.appendChild(timeDiv);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(wrapper);
        
        return messageDiv;
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }
    
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Inicializar o chatbot
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});