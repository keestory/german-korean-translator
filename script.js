class PapagoStyleTranslator {
    constructor() {
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
        this.savedTranslations = JSON.parse(localStorage.getItem('savedTranslations')) || [];
        this.currentLanguages = { from: 'ko', to: 'de' }; // 기본값: 한국어 -> 독일어
        this.recognition = null;
        this.isListening = false;
        
        this.initializeEventListeners();
        this.initializeSpeechRecognition();
        this.loadTranslationHistory();
    }

    initializeSpeechRecognition() {
        // Web Speech API 지원 확인
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // 음성 인식 설정
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            // 언어 설정 (현재 선택된 언어에 따라)
            this.updateRecognitionLanguage();
            
            // 이벤트 리스너 설정
            this.recognition.onstart = () => {
                this.isListening = true;
                this.showNotification('음성 인식이 시작되었습니다. 말씀해주세요...', 'success');
                this.voiceBtn.classList.add('listening');
                this.voiceBtn.querySelector('.btn-text').textContent = 'Listening...';
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('음성 인식 결과:', transcript);
                
                // 인식된 텍스트를 입력 필드에 설정
                this.textInput.value = transcript;
                
                // 자동으로 번역 실행
                this.translateText(transcript);
                
                this.showNotification('음성을 인식했습니다!', 'success');
            };
            
            this.recognition.onerror = (event) => {
                console.error('음성 인식 오류:', event.error);
                this.isListening = false;
                this.voiceBtn.classList.remove('listening');
                this.voiceBtn.querySelector('.btn-text').textContent = 'Voice';
                
                let errorMessage = '음성 인식에 실패했습니다.';
                switch (event.error) {
                    case 'no-speech':
                        errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
                        break;
                    case 'audio-capture':
                        errorMessage = '마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요.';
                        break;
                    case 'not-allowed':
                        errorMessage = '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
                        break;
                    case 'network':
                        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
                        break;
                    case 'aborted':
                        errorMessage = '음성 인식이 중단되었습니다.';
                        break;
                }
                this.showNotification(errorMessage, 'error');
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.voiceBtn.classList.remove('listening');
                this.voiceBtn.querySelector('.btn-text').textContent = 'Voice';
            };
            
            console.log('음성 인식이 초기화되었습니다.');
        } else {
            console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
        }
    }

    updateRecognitionLanguage() {
        if (this.recognition) {
            // 현재 선택된 언어에 따라 음성 인식 언어 설정
            const languageMap = {
                'ko': 'ko-KR',
                'de': 'de-DE',
                'en': 'en-US',
                'ja': 'ja-JP',
                'zh': 'zh-CN'
            };
            
            const recognitionLang = languageMap[this.currentLanguages.from] || 'ko-KR';
            this.recognition.lang = recognitionLang;
            console.log('음성 인식 언어 설정:', recognitionLang);
        }
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
                this.saveTranslation(text, translation);
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
            // Google Translate API 사용
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`
            );
            const data = await response.json();
            
            if (data && data[0] && data[0][0]) {
                return data[0][0][0];
            }
            
            return null;
        } catch (error) {
            console.error('번역 API 오류:', error);
            return this.simpleTranslation(text, fromLang, toLang);
        }
    }

    simpleTranslation(text, fromLang, toLang) {
        // 간단한 사전 (독일어-한국어)
        const dictionary = {
            'de-ko': {
                'hallo': '안녕하세요',
                'danke': '감사합니다',
                'bitte': '부탁합니다',
                'ja': '네',
                'nein': '아니오',
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
                'kalt': '차가운'
            },
            'ko-de': {
                '안녕하세요': 'Hallo',
                '감사합니다': 'Danke',
                '부탁합니다': 'Bitte',
                '네': 'Ja',
                '아니오': 'Nein',
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
                '차가운': 'Kalt'
            }
        };
        
        const key = `${fromLang}-${toLang}`;
        const lowerText = text.toLowerCase().trim();
        return dictionary[key] ? dictionary[key][lowerText] || '번역을 찾을 수 없습니다' : '지원하지 않는 언어입니다';
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
        
        // 음성 인식 언어 업데이트
        this.updateRecognitionLanguage();
        
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
                
                // 번역 기록에 저장
                this.saveTranslation(extractedText, this.resultText.textContent, imageData);
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

    saveTranslation(original, translated, imageData = null) {
        const translation = {
            id: Date.now(),
            original: original,
            translated: translated,
            fromLang: this.currentLanguages.from,
            toLang: this.currentLanguages.to,
            timestamp: new Date().toISOString(),
            image: imageData
        };
        
        this.savedTranslations.unshift(translation);
        
        // 최대 50개만 저장
        if (this.savedTranslations.length > 50) {
            this.savedTranslations = this.savedTranslations.slice(0, 50);
        }
        
        localStorage.setItem('savedTranslations', JSON.stringify(this.savedTranslations));
        this.loadTranslationHistory();
    }

    loadTranslationHistory() {
        this.translationHistory.innerHTML = '';
        
        this.savedTranslations.slice(0, 10).forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="original">${item.original}</div>
                <div class="translated">${item.translated}</div>
                <div class="timestamp">${new Date(item.timestamp).toLocaleString('ko-KR')}</div>
            `;
            
            // 클릭 시 텍스트 입력 필드에 설정
            historyItem.addEventListener('click', () => {
                this.textInput.value = item.original;
                this.resultText.textContent = item.translated;
                this.translationResult.style.display = 'block';
            });
            
            this.translationHistory.appendChild(historyItem);
        });
    }

    // 음성 입력 기능
    handleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('이 브라우저는 음성 인식을 지원하지 않습니다.', 'error');
            return;
        }
        
        if (this.isListening) {
            // 이미 듣고 있다면 중지
            this.recognition.stop();
            this.showNotification('음성 인식을 중지했습니다.', 'success');
            return;
        }
        
        try {
            // 음성 인식 시작
            this.recognition.start();
        } catch (error) {
            console.error('음성 인식 시작 오류:', error);
            this.showNotification('음성 인식을 시작할 수 없습니다. 다시 시도해주세요.', 'error');
        }
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
    new PapagoStyleTranslator();
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