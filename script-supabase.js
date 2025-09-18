// Supabase 통합 독일어-한국어 번역기
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Supabase 설정 (supabase-config.js 내용을 직접 포함)
const SUPABASE_CONFIG = {
    // Supabase 프로젝트 URL
    url: 'https://lpcsklsszksgrjfttglf.supabase.co',
    
    // Supabase 공개 API 키
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3NrbHNzemtzZ3JqZnR0Z2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDYxOTgsImV4cCI6MjA3Mzc4MjE5OH0.OqwELqsPHlJIn-JZ7oRGHvWYgv-mdoKxMBIuKng70SE',
    
    // 데이터베이스 테이블 이름
    tables: {
        translations: 'translations',
        users: 'users'
    }
};

class SupabaseTranslator {
    constructor() {
        // Supabase 클라이언트 초기화
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // DOM 요소들
        this.textInput = document.getElementById('textInput');
        this.translationResult = document.getElementById('translationResult');
        this.resultText = document.getElementById('resultText');
        this.cameraSection = document.getElementById('cameraSection');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.historySection = document.getElementById('historySection');
        this.translationHistory = document.getElementById('translationHistory');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.notification = document.getElementById('notification');
        
        // 버튼들
        this.swapLanguagesBtn = document.getElementById('swapLanguages');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.conversationBtn = document.getElementById('conversationBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.documentBtn = document.getElementById('documentBtn');
        this.studyBtn = document.getElementById('studyBtn');
        this.capturePhotoBtn = document.getElementById('capturePhoto');
        this.closeCameraBtn = document.getElementById('closeCamera');
        
        // 상태 변수들
        this.stream = null;
        this.isTranslating = false;
        this.translationInterval = null;
        this.currentLanguages = { from: 'ko', to: 'de' };
        this.userId = this.generateUserId();
        
        this.initializeEventListeners();
        this.loadTranslationHistory();
    }

    generateUserId() {
        // 간단한 사용자 ID 생성 (실제로는 인증 시스템 사용)
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    initializeEventListeners() {
        // 텍스트 입력 이벤트
        this.textInput.addEventListener('input', () => this.handleTextInput());
        
        // 언어 스왑 버튼
        this.swapLanguagesBtn.addEventListener('click', () => this.swapLanguages());
        
        // 액션 버튼들
        this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        this.conversationBtn.addEventListener('click', () => this.handleConversation());
        this.imageBtn.addEventListener('click', () => this.startCamera());
        this.documentBtn.addEventListener('click', () => this.handleDocument());
        this.studyBtn.addEventListener('click', () => this.handleStudyCamera());
        
        // 카메라 관련 버튼들
        this.capturePhotoBtn.addEventListener('click', () => this.capturePhoto());
        this.closeCameraBtn.addEventListener('click', () => this.closeCamera());
    }

    handleTextInput() {
        const text = this.textInput.value.trim();
        if (text.length > 0) {
            this.translateText(text);
        } else {
            this.hideTranslationResult();
        }
    }

    async translateText(text) {
        if (this.isTranslating) return;
        
        this.isTranslating = true;
        this.showLoading('번역 중...');
        
        try {
            const translation = await this.performTranslation(text, this.currentLanguages.from, this.currentLanguages.to);
            
            if (translation) {
                this.showTranslationResult(translation);
                await this.saveTranslationToSupabase(text, translation);
            } else {
                this.showNotification('번역에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('번역 오류:', error);
            this.showNotification('번역 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isTranslating = false;
            this.hideLoading();
        }
    }

    async performTranslation(text, fromLang, toLang) {
        try {
            // 먼저 간단한 사전에서 찾기
            const simpleResult = this.simpleTranslation(text, fromLang, toLang);
            if (simpleResult && simpleResult !== '번역을 찾을 수 없습니다') {
                return simpleResult;
            }

            // Google Translate API 사용 (백업)
            try {
                const response = await fetch(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`,
                    {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data[0] && data[0][0]) {
                        return data[0][0][0];
                    }
                }
            } catch (apiError) {
                console.log('Google Translate API 제한됨, 사전 사용');
            }
            
            return simpleResult;
        } catch (error) {
            console.error('번역 오류:', error);
            return this.simpleTranslation(text, fromLang, toLang);
        }
    }

    simpleTranslation(text, fromLang, toLang) {
        // 확장된 사전 (독일어-한국어)
        const dictionary = {
            'de-ko': {
                // 기본 인사
                'hallo': '안녕하세요',
                'hi': '안녕',
                'guten tag': '좋은 하루',
                'guten morgen': '좋은 아침',
                'guten abend': '좋은 저녁',
                'gute nacht': '좋은 밤',
                'auf wiedersehen': '안녕히 가세요',
                'tschüss': '안녕',
                'bis bald': '곧 봐요',
                
                // 감사와 예의
                'danke': '감사합니다',
                'danke schön': '정말 감사합니다',
                'vielen dank': '대단히 감사합니다',
                'bitte': '부탁합니다',
                'bitte schön': '천만에요',
                'entschuldigung': '죄송합니다',
                'es tut mir leid': '미안합니다',
                
                // 기본 단어
                'ja': '네',
                'nein': '아니오',
                'ok': '좋아요',
                'gut': '좋은',
                'schlecht': '나쁜',
                'groß': '큰',
                'klein': '작은',
                'neu': '새로운',
                'alt': '오래된',
                'schön': '아름다운',
                'wichtig': '중요한',
                'einfach': '간단한',
                'schwer': '어려운',
                'schnell': '빠른',
                'langsam': '느린',
                'teuer': '비싼',
                'billig': '저렴한',
                'warm': '따뜻한',
                'kalt': '차가운',
                
                // 질문
                'wie geht es dir': '어떻게 지내세요',
                'wie geht es ihnen': '어떻게 지내세요',
                'was ist das': '이것은 무엇인가요',
                'wo ist': '어디에 있나요',
                'wie viel': '얼마나',
                'wann': '언제',
                'warum': '왜',
                'wer': '누구',
                
                // 숫자
                'eins': '하나',
                'zwei': '둘',
                'drei': '셋',
                'vier': '넷',
                'fünf': '다섯',
                'sechs': '여섯',
                'sieben': '일곱',
                'acht': '여덟',
                'neun': '아홉',
                'zehn': '열'
            },
            'ko-de': {
                // 기본 인사
                '안녕하세요': 'Hallo',
                '안녕': 'Hi',
                '좋은 하루': 'Guten Tag',
                '좋은 아침': 'Guten Morgen',
                '좋은 저녁': 'Guten Abend',
                '좋은 밤': 'Gute Nacht',
                '안녕히 가세요': 'Auf Wiedersehen',
                '안녕': 'Tschüss',
                '곧 봐요': 'Bis bald',
                
                // 감사와 예의
                '감사합니다': 'Danke',
                '정말 감사합니다': 'Danke schön',
                '대단히 감사합니다': 'Vielen Dank',
                '부탁합니다': 'Bitte',
                '천만에요': 'Bitte schön',
                '죄송합니다': 'Entschuldigung',
                '미안합니다': 'Es tut mir leid',
                
                // 기본 단어
                '네': 'Ja',
                '아니오': 'Nein',
                '좋아요': 'OK',
                '좋은': 'Gut',
                '나쁜': 'Schlecht',
                '큰': 'Groß',
                '작은': 'Klein',
                '새로운': 'Neu',
                '오래된': 'Alt',
                '아름다운': 'Schön',
                '중요한': 'Wichtig',
                '간단한': 'Einfach',
                '어려운': 'Schwer',
                '빠른': 'Schnell',
                '느린': 'Langsam',
                '비싼': 'Teuer',
                '저렴한': 'Billig',
                '따뜻한': 'Warm',
                '차가운': 'Kalt',
                
                // 질문
                '어떻게 지내세요': 'Wie geht es dir',
                '이것은 무엇인가요': 'Was ist das',
                '어디에 있나요': 'Wo ist',
                '얼마나': 'Wie viel',
                '언제': 'Wann',
                '왜': 'Warum',
                '누구': 'Wer',
                
                // 숫자
                '하나': 'Eins',
                '둘': 'Zwei',
                '셋': 'Drei',
                '넷': 'Vier',
                '다섯': 'Fünf',
                '여섯': 'Sechs',
                '일곱': 'Sieben',
                '여덟': 'Acht',
                '아홉': 'Neun',
                '열': 'Zehn'
            }
        };
        
        const key = `${fromLang}-${toLang}`;
        const lowerText = text.toLowerCase().trim();
        
        // 정확한 매치 먼저 시도
        if (dictionary[key] && dictionary[key][lowerText]) {
            return dictionary[key][lowerText];
        }
        
        // 부분 매치 시도 (문장의 경우)
        if (dictionary[key]) {
            for (const [key, value] of Object.entries(dictionary[key])) {
                if (lowerText.includes(key)) {
                    return value;
                }
            }
        }
        
        return '번역을 찾을 수 없습니다';
    }

    showTranslationResult(translation) {
        this.resultText.textContent = translation;
        this.translationResult.style.display = 'block';
        this.historySection.style.display = 'block';
    }

    hideTranslationResult() {
        this.translationResult.style.display = 'none';
    }

    swapLanguages() {
        const temp = this.currentLanguages.from;
        this.currentLanguages.from = this.currentLanguages.to;
        this.currentLanguages.to = temp;
        
        // UI 업데이트
        const languageSelectors = document.querySelectorAll('.language-text');
        const fromText = languageSelectors[0];
        const toText = languageSelectors[1];
        
        const tempText = fromText.textContent;
        fromText.textContent = toText.textContent;
        toText.textContent = tempText;
        
        // 텍스트 입력과 결과 스왑
        const inputText = this.textInput.value;
        const resultText = this.resultText.textContent;
        
        if (inputText && resultText) {
            this.textInput.value = resultText;
            this.resultText.textContent = inputText;
        }
        
        this.showNotification('언어가 변경되었습니다.', 'success');
    }

    async startCamera() {
        try {
            this.showLoading('카메라를 시작하는 중...');
            
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.hideLoading();
                this.cameraSection.style.display = 'flex';
                this.showNotification('카메라가 시작되었습니다!', 'success');
            });

        } catch (error) {
            this.hideLoading();
            console.error('카메라 시작 오류:', error);
            this.showNotification('카메라 접근 권한이 필요합니다.', 'error');
        }
    }

    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.cameraSection.style.display = 'none';
        this.showNotification('카메라가 중지되었습니다.', 'success');
    }

    async capturePhoto() {
        try {
            this.showLoading('사진 촬영 중...');
            
            // 현재 비디오 프레임을 캔버스에 그리기
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // 캔버스를 이미지로 변환
            const imageData = this.canvas.toDataURL('image/jpeg', 0.9);
            
            // OCR로 텍스트 추출
            const extractedText = await this.extractTextFromImage(imageData);
            
            if (extractedText && extractedText.trim()) {
                // 텍스트를 입력 필드에 설정하고 번역
                this.textInput.value = extractedText;
                await this.translateText(extractedText);
                
                // Supabase에 번역 기록 저장
                await this.saveTranslationToSupabase(extractedText, this.resultText.textContent, imageData);
            } else {
                this.showNotification('텍스트를 인식할 수 없습니다.', 'error');
            }
            
            this.hideLoading();
            this.closeCamera();
            
        } catch (error) {
            this.hideLoading();
            console.error('사진 촬영 오류:', error);
            this.showNotification('사진 촬영에 실패했습니다.', 'error');
        }
    }

    async extractTextFromImage(imageData) {
        try {
            this.showLoading('텍스트 인식 중...');
            
            const { data: { text } } = await Tesseract.recognize(
                imageData,
                this.currentLanguages.from === 'de' ? 'deu' : 'kor',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`진행률: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            this.hideLoading();
            return text;
        } catch (error) {
            this.hideLoading();
            console.error('OCR 오류:', error);
            return '';
        }
    }

    async saveTranslationToSupabase(original, translated, imageData = null) {
        try {
            const translationData = {
                user_id: this.userId,
                original_text: original,
                translated_text: translated,
                from_language: this.currentLanguages.from,
                to_language: this.currentLanguages.to,
                image_data: imageData,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(SUPABASE_CONFIG.tables.translations)
                .insert([translationData]);

            if (error) {
                console.error('Supabase 저장 오류:', error);
                // 오프라인 시 로컬 스토리지에 백업
                this.saveToLocalStorage(original, translated, imageData);
            } else {
                console.log('번역이 Supabase에 저장되었습니다:', data);
                this.loadTranslationHistory();
            }
        } catch (error) {
            console.error('저장 오류:', error);
            // 오프라인 시 로컬 스토리지에 백업
            this.saveToLocalStorage(original, translated, imageData);
        }
    }

    saveToLocalStorage(original, translated, imageData = null) {
        const translation = {
            id: Date.now(),
            original: original,
            translated: translated,
            fromLang: this.currentLanguages.from,
            toLang: this.currentLanguages.to,
            timestamp: new Date().toISOString(),
            image: imageData
        };
        
        let savedTranslations = JSON.parse(localStorage.getItem('savedTranslations')) || [];
        savedTranslations.unshift(translation);
        
        // 최대 50개만 저장
        if (savedTranslations.length > 50) {
            savedTranslations = savedTranslations.slice(0, 50);
        }
        
        localStorage.setItem('savedTranslations', JSON.stringify(savedTranslations));
    }

    async loadTranslationHistory() {
        try {
            // Supabase에서 번역 기록 가져오기
            const { data, error } = await this.supabase
                .from(SUPABASE_CONFIG.tables.translations)
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Supabase 로드 오류:', error);
                // 오프라인 시 로컬 스토리지에서 로드
                this.loadFromLocalStorage();
                return;
            }

            this.displayTranslationHistory(data || []);
        } catch (error) {
            console.error('로드 오류:', error);
            // 오프라인 시 로컬 스토리지에서 로드
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const savedTranslations = JSON.parse(localStorage.getItem('savedTranslations')) || [];
        const formattedData = savedTranslations.map(item => ({
            original_text: item.original,
            translated_text: item.translated,
            from_language: item.fromLang,
            to_language: item.toLang,
            created_at: item.timestamp,
            image_data: item.image
        }));
        
        this.displayTranslationHistory(formattedData);
    }

    displayTranslationHistory(translations) {
        this.translationHistory.innerHTML = '';
        
        translations.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="original">${item.original_text}</div>
                <div class="translated">${item.translated_text}</div>
                <div class="timestamp">${new Date(item.created_at).toLocaleString('ko-KR')}</div>
            `;
            
            // 클릭 시 텍스트 입력 필드에 설정
            historyItem.addEventListener('click', () => {
                this.textInput.value = item.original_text;
                this.resultText.textContent = item.translated_text;
                this.translationResult.style.display = 'block';
            });
            
            this.translationHistory.appendChild(historyItem);
        });
    }

    // 추가 기능들 (향후 구현)
    handleVoiceInput() {
        this.showNotification('음성 입력 기능은 준비 중입니다.', 'success');
    }

    handleConversation() {
        this.showNotification('대화 번역 기능은 준비 중입니다.', 'success');
    }

    handleDocument() {
        this.showNotification('문서 번역 기능은 준비 중입니다.', 'success');
    }

    handleStudyCamera() {
        this.showNotification('학습 카메라 기능은 준비 중입니다.', 'success');
    }

    showLoading(message = '처리 중...') {
        this.loadingOverlay.querySelector('p').textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.style.display = 'block';
        
        setTimeout(() => {
            this.notification.style.display = 'none';
        }, 3000);
    }
}

// 페이지 로드 시 번역기 초기화
document.addEventListener('DOMContentLoaded', () => {
    new SupabaseTranslator();
});

// 서비스 워커 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
