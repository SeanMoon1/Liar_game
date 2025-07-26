// Firebase Realtime Database 기반 방 관리 시스템
class RoomManager {
    constructor() {
        this.database = firebase.database();
        this.roomsRef = this.database.ref('rooms');
        this.messagesRef = this.database.ref('messages');
    }

    // 방 생성
    async createRoom(roomCode, hostName) {
        try {
            const roomData = {
                code: roomCode,
                host: hostName,
                players: [{ name: hostName, isHost: true }],
                gameStarted: false,
                topic: '',
                liar: null,
                messages: [],
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                maxPlayers: 10
            };

            await this.roomsRef.child(roomCode).set(roomData);
            return roomData;
        } catch (error) {
            console.error('방 생성 실패:', error);
            return null;
        }
    }

    // 방 참가
    async joinRoom(roomCode, playerName) {
        try {
            const roomRef = this.roomsRef.child(roomCode);
            const snapshot = await roomRef.once('value');
            
            if (!snapshot.exists()) {
                throw new Error('존재하지 않는 방입니다.');
            }

            const room = snapshot.val();
            
            if (room.gameStarted) {
                throw new Error('게임이 이미 시작되었습니다.');
            }

            if (room.players.length >= room.maxPlayers) {
                throw new Error('방 인원이 가득 찼습니다.');
            }

            const existingPlayer = room.players.find(p => p.name === playerName);
            if (existingPlayer) {
                throw new Error('같은 이름의 플레이어가 이미 있습니다.');
            }

            // 플레이어 추가
            room.players.push({ name: playerName, isHost: false });
            await roomRef.update({ players: room.players });
            
            return room;
        } catch (error) {
            console.error('방 참가 실패:', error);
            throw error;
        }
    }

    // 방 정보 가져오기
    async getRoom(roomCode) {
        try {
            const snapshot = await this.roomsRef.child(roomCode).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('방 정보 조회 실패:', error);
            return null;
        }
    }

    // 플레이어 제거
    async removePlayer(roomCode, playerName) {
        try {
            const roomRef = this.roomsRef.child(roomCode);
            const snapshot = await roomRef.once('value');
            
            if (!snapshot.exists()) {
                return false;
            }

            const room = snapshot.val();
            room.players = room.players.filter(p => p.name !== playerName);

            if (room.players.length === 0) {
                // 방이 비면 삭제
                await roomRef.remove();
                return true;
            }

            // 방장이 나간 경우 새로운 방장 지정
            if (room.host === playerName) {
                room.host = room.players[0].name;
                room.players[0].isHost = true;
            }

            await roomRef.update({ 
                players: room.players,
                host: room.host
            });
            
            return true;
        } catch (error) {
            console.error('플레이어 제거 실패:', error);
            return false;
        }
    }

    // 실시간 방 정보 구독
    subscribeToRoom(roomCode, callback) {
        const roomRef = this.roomsRef.child(roomCode);
        return roomRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            } else {
                callback(null);
            }
        });
    }

    // 실시간 메시지 구독
    subscribeToMessages(roomCode, callback) {
        const messagesRef = this.messagesRef.child(roomCode);
        return messagesRef.on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }

    // 메시지 전송
    async sendMessage(roomCode, message) {
        try {
            await this.messagesRef.child(roomCode).push({
                ...message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            return false;
        }
    }

    // 게임 시작
    async startGame(roomCode, topic, liar, keywords) {
        console.log('RoomManager: 게임 시작 요청', { roomCode, topic, liar, keywords });
        try {
            await this.roomsRef.child(roomCode).update({
                gameStarted: true,
                topic: topic,
                liar: liar,
                keywords: keywords
            });
            console.log('RoomManager: 게임 시작 성공');
            return true;
        } catch (error) {
            console.error('RoomManager: 게임 시작 실패:', error);
            throw error; // 에러를 다시 던져서 상위에서 처리
        }
    }

    // 구독 해제
    unsubscribe(roomCode, messageSubscription = null) {
        this.roomsRef.child(roomCode).off();
        if (messageSubscription) {
            this.messagesRef.child(roomCode).off();
        }
    }
}

// Firebase 초기화 확인
let roomManager;

// Firebase가 로드된 후 방 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Firebase가 초기화되었는지 확인
        if (typeof firebase !== 'undefined' && firebase.database) {
            roomManager = new RoomManager();
            console.log('Firebase 연결 성공, RoomManager 초기화 완료');
        } else {
            console.error('Firebase가 로드되지 않았습니다.');
            alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    } catch (error) {
        console.error('Firebase 초기화 에러:', error);
        alert('Firebase 초기화에 실패했습니다: ' + error.message);
    }
});

// 게임 상태 관리
class LiarGame {
    constructor() {
        this.currentScreen = 'home';
        this.playerName = '';
        this.roomId = '';
        this.isHost = false;
        this.players = [];
        this.selectedTopic = '';
        this.gameData = {
            topic: '',
            keyword: '',
            isLiar: false,
            liarKeyword: ''
        };
        this.votes = {};
        this.selectedVote = null;
        this.messages = [];
        
        this.initializeEventListeners();
        
        // 로컬 키워드 데이터 저장
        this.localKeywords = this.loadKeywords();
        console.log('로컬 키워드 로드 완료:', Object.keys(this.localKeywords));
        
        // 주기적으로 방 정보 업데이트
        this.startRoomUpdateInterval();
    }

    // 방 정보 업데이트 인터벌 시작 (Firebase 실시간 구독으로 대체됨)
    startRoomUpdateInterval() {
        // Firebase 실시간 구독을 사용하므로 더 이상 필요하지 않음
        console.log('Firebase 실시간 구독을 사용합니다.');
    }

    // 실시간 방 정보 구독 시작
    startRoomSubscription() {
        this.roomSubscription = roomManager.subscribeToRoom(this.roomId, (room) => {
            if (room) {
                this.players = room.players;
                this.gameStarted = room.gameStarted;
                this.topic = room.topic;
                this.liar = room.liar;
                this.keywords = room.keywords;
                
                if (this.gameStarted && this.currentScreen !== 'game') {
                    this.showScreen('game');
                    this.initializeGame();
                } else if (!this.gameStarted && this.currentScreen === 'waiting') {
                    this.initializeWaitingRoom();
                }
            } else {
                // 방이 삭제된 경우
                alert('방이 삭제되었습니다.');
                this.leaveRoom();
            }
        });
    }

    // 실시간 메시지 구독 시작
    startMessageSubscription() {
        this.messageSubscription = roomManager.subscribeToMessages(this.roomId, (message) => {
            this.addMessageToChat(message);
        });
    }

    // 키워드 데이터 로드
    loadKeywords() {
        return {
            politics: {
                normal: ['대통령', '국회', '정부', '민주주의', '선거', '정책', '법률', '외교'],
                liar: ['총리', '의회', '행정부', '공화국', '투표', '방침', '규정', '국제관계']
            },
            economy: {
                normal: ['주식', '은행', '투자', '경제', '금융', '부동산', '무역', '인플레이션'],
                liar: ['증권', '금고', '자본', '재정', '자금', '부동자산', '상업', '물가상승']
            },
            history: {
                normal: ['고조선', '삼국시대', '고려', '조선', '일제강점기', '독립운동', '6.25전쟁', '민주화'],
                liar: ['로마제국', '중세시대', '르네상스', '프랑스혁명', '산업혁명', '세계대전', '냉전시대', '정보화시대']
            },
            general: {
                normal: ['지구', '태양', '달', '별', '우주', '은하수', '행성', '소행성'],
                liar: ['바다', '산', '강', '숲', '사막', '빙하', '화산', '지진']
            },
            culture: {
                normal: ['한복', '김치', '태권도', '판소리', '한글', '불교', '유교', '전통'],
                liar: ['전통의상', '발효음식', '무술', '민속음악', '한국문자', '종교', '철학', '문화']
            },
            animals: {
                normal: ['호랑이', '곰', '사자', '코끼리', '기린', '팬더', '펭귄', '고래'],
                liar: ['늑대', '여우', '치타', '하마', '얼룩말', '코알라', '알파카', '돌고래']
            },
            plants: {
                normal: ['소나무', '벚꽃', '장미', '해바라기', '튤립', '국화', '난초', '수국'],
                liar: ['단풍나무', '개나리', '튤립', '카네이션', '백합', '장미', '카라', '안개꽃']
            },
            games: {
                normal: ['롤', '오버워치', '마인크래프트', '포켓몬', '피파', '배틀그라운드', '스타크래프트', '디아블로'],
                liar: ['발로란트', '팔라딘', '테라리아', '디지몬', '이스포츠', '포트나이트', '워크래프트', '포켓몬고']
            },
            movies: {
                normal: ['아바타', '타이타닉', '스타워즈', '해리포터', '반지의제왕', '인터스텔라', '인셉션', '어벤져스'],
                liar: ['토이스토리', '라이온킹', '스파이더맨', '반지의제왕', '듄', '매트릭스', '배트맨', '가디언즈']
            },
            music: {
                normal: ['BTS', '블랙핑크', '아이유', '싸이', '빅뱅', '소녀시대', '엑소', '레드벨벳'],
                liar: ['세븐틴', '투모로우바이투게더', '태연', '제니', '투피엠', '아이브', '뉴진스', '르세라핌']
            },
            all: {
                normal: ['지구', '태양', '달', '별', '우주', '은하수', '행성', '소행성'],
                liar: ['바다', '산', '강', '숲', '사막', '빙하', '화산', '지진']
            }
        };
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 홈 화면
        document.getElementById('start-btn').addEventListener('click', () => this.showScreen('room-select'));
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('home'));

        // 방 선택 화면
        document.getElementById('create-room-btn').addEventListener('click', () => this.showScreen('nickname'));
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinRoomByCode());
        document.getElementById('back-to-home-btn').addEventListener('click', () => this.showScreen('home'));
        
        // 방 코드 입력 실시간 검증
        document.getElementById('room-code-input').addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            // 영문+숫자만 허용
            value = value.replace(/[^A-Z0-9]/g, '');
            e.target.value = value;
        });

        // 닉네임 입력
        document.getElementById('join-btn').addEventListener('click', () => this.joinGame());
        document.getElementById('copy-link').addEventListener('click', () => this.copyRoomLink());
        document.getElementById('copy-link-waiting').addEventListener('click', () => this.copyRoomLinkWaiting());

        // 대기실
        document.getElementById('start-game-btn').addEventListener('click', () => this.showScreen('topic'));
        document.getElementById('leave-room-btn').addEventListener('click', () => this.leaveRoom());

        // 주제 선택
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTopic(e.target));
        });
        document.getElementById('confirm-topic-btn').addEventListener('click', () => this.startGame());
        document.getElementById('back-to-waiting-btn').addEventListener('click', () => this.showScreen('waiting'));

        // 게임 화면
        document.getElementById('send-message-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('vote-btn').addEventListener('click', () => this.showVoteScreen());
        document.getElementById('end-game-btn').addEventListener('click', () => this.endGame());

        // 투표 화면
        document.getElementById('confirm-vote-btn').addEventListener('click', () => this.confirmVote());
        document.getElementById('cancel-vote-btn').addEventListener('click', () => this.showScreen('game'));

        // 결과 화면
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-home-btn').addEventListener('click', () => this.showScreen('home'));

        // 엔터키 이벤트
        document.getElementById('nickname-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoomByCode();
        });
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // URL 파라미터 확인
        this.checkUrlParams();
    }

    // URL 파라미터 확인 (방 참가용)
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        if (roomId) {
            this.roomId = roomId;
            this.showScreen('nickname');
        }
    }

    // 화면 전환
    showScreen(screenName) {
        console.log('화면 전환:', screenName); // 디버깅용
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 해당 화면 보이기
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log('화면 전환 성공:', screenName); // 디버깅용
            
            // 화면별 초기화
            switch (screenName) {
                case 'waiting':
                    this.initializeWaitingRoom();
                    break;
                case 'game':
                    this.initializeGame();
                    break;
                case 'vote':
                    this.initializeVoteScreen();
                    break;
            }
        } else {
            console.error('화면을 찾을 수 없습니다:', `${screenName}-screen`); // 디버깅용
        }
    }

    // 게임 참가
    joinGame() {
        const nickname = document.getElementById('nickname-input').value.trim();
        if (!nickname) {
            alert('닉네임을 입력해주세요.');
            return;
        }
        if (nickname.length > 12) {
            alert('닉네임은 12글자 이내로 입력해주세요.');
            return;
        }

        this.playerName = nickname;

        // 방 생성 또는 참가
        if (!this.roomId) {
            this.createRoom();
        } else {
            this.joinExistingRoom();
        }
    }

    // 방 생성
    async createRoom() {
        // roomManager가 초기화되었는지 확인
        if (!roomManager) {
            console.error('RoomManager가 초기화되지 않았습니다.');
            alert('Firebase 연결에 문제가 있습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        this.roomId = this.generateRoomId();
        
        try {
            // 방 매니저에 방 생성
            const room = await roomManager.createRoom(this.roomId, this.playerName);
            if (!room) {
                alert('방 생성에 실패했습니다. 다시 시도해주세요.');
                return;
            }
            
            this.isHost = true;
            this.players = room.players;
            
            // 방 코드 표시
            document.getElementById('room-code-display').textContent = this.roomId;
            
            // 방 링크 생성
            const roomLink = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
            document.getElementById('share-link').value = roomLink;
            document.getElementById('room-link').classList.remove('hidden');
            
            this.showScreen('waiting');
            
            // 실시간 구독 시작
            this.startRoomSubscription();
        } catch (error) {
            alert('방 생성에 실패했습니다: ' + error.message);
        }
    }

    // 기존 방 참가
    async joinExistingRoom() {
        // roomManager가 초기화되었는지 확인
        if (!roomManager) {
            console.error('RoomManager가 초기화되지 않았습니다.');
            alert('Firebase 연결에 문제가 있습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        try {
            // 방에 참가
            const joinedRoom = await roomManager.joinRoom(this.roomId, this.playerName);
            
            this.isHost = false;
            this.players = joinedRoom.players;
            
            // 방 링크 표시
            const roomLink = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
            document.getElementById('share-link').value = roomLink;
            document.getElementById('room-link').classList.remove('hidden');
            
            this.showScreen('waiting');
            
            // 실시간 구독 시작
            this.startRoomSubscription();
        } catch (error) {
            alert('방 참가에 실패했습니다: ' + error.message);
            this.showScreen('room-select');
        }
    }

    // 방 코드 생성 (영문+숫자만 사용)
    generateRoomId() {
        // 영문 대문자와 숫자만 사용 (특수문자 제외)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const allChars = letters + numbers;
        
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // 생성된 코드가 영문+숫자만 포함하는지 한번 더 검증
        if (!/^[A-Z0-9]{6}$/.test(result)) {
            // 만약 특수문자가 포함되어 있다면 다시 생성
            return this.generateRoomId();
        }
        
        return result;
    }

    // 방 코드로 참가
    joinRoomByCode() {
        let roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
        
        if (!roomCode) {
            alert('방 코드를 입력해주세요.');
            return;
        }
        
        if (roomCode.length !== 6) {
            alert('방 코드는 6자리여야 합니다.');
            return;
        }
        
        // 영문+숫자만 허용하는지 엄격하게 검증
        if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
            alert('방 코드는 영문 대문자와 숫자만 사용 가능합니다.');
            document.getElementById('room-code-input').value = '';
            return;
        }
        
        this.roomId = roomCode;
        this.showScreen('nickname');
    }

    // 방 링크 복사
    copyRoomLink() {
        const linkInput = document.getElementById('share-link');
        linkInput.select();
        document.execCommand('copy');
        alert('방 링크가 복사되었습니다!');
    }

    // 대기실 방 링크 복사
    copyRoomLinkWaiting() {
        const linkInput = document.getElementById('share-link-waiting');
        linkInput.select();
        document.execCommand('copy');
        alert('방 링크가 복사되었습니다!');
    }

    // 대기실 초기화
    initializeWaitingRoom() {
        const host = this.players.find(p => p.isHost);
        document.getElementById('host-name').textContent = host?.name || '방장';
        document.getElementById('player-count').textContent = this.players.length;
        
        // 방 링크 표시 (대기실에서도 링크를 볼 수 있도록)
        if (this.roomId) {
            document.getElementById('room-code-display-waiting').textContent = this.roomId;
            const roomLink = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
            document.getElementById('share-link-waiting').value = roomLink;
            document.getElementById('room-link-waiting').classList.remove('hidden');
        }
        
        // 참가자 목록 업데이트
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        // 방장을 먼저 표시
        const hostPlayer = this.players.find(p => p.isHost);
        if (hostPlayer) {
            const hostCard = document.createElement('div');
            hostCard.className = 'player-card host';
            hostCard.innerHTML = `
                <div class="player-info">
                    <span class="player-name">👑 ${hostPlayer.name}</span>
                </div>
                <span class="player-status">방장</span>
            `;
            playersList.appendChild(hostCard);
        }
        
        // 일반 참가자들을 표시
        this.players.filter(p => !p.isHost).forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <div class="player-info">
                    <span class="player-name">👤 ${player.name}</span>
                </div>
                <span class="player-status">참가자</span>
            `;
            playersList.appendChild(playerCard);
        });

        // 방장만 게임 시작 버튼 활성화
        const startBtn = document.getElementById('start-game-btn');
        startBtn.disabled = !this.isHost;
    }

    // 방 나가기
    async leaveRoom() {
        // 구독 해제
        if (this.roomSubscription) {
            roomManager.unsubscribe(this.roomId, this.messageSubscription);
            this.roomSubscription = null;
            this.messageSubscription = null;
        }
        
        if (this.roomId && this.playerName) {
            await roomManager.removePlayer(this.roomId, this.playerName);
        }
        
        this.roomId = '';
        this.isHost = false;
        this.players = [];
        this.playerName = '';
        this.gameStarted = false;
        this.topic = '';
        this.liar = null;
        this.keywords = null;
        document.getElementById('nickname-input').value = '';
        document.getElementById('room-link').classList.add('hidden');
        document.getElementById('room-link-waiting').classList.add('hidden');
        this.showScreen('home');
    }

    // 주제 선택
    selectTopic(button) {
        console.log('주제 선택:', button.dataset.topic);
        
        // 기존 선택 해제
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 새 선택
        button.classList.add('selected');
        this.selectedTopic = button.dataset.topic;
        console.log('선택된 주제 저장:', this.selectedTopic);
        
        // 시작 버튼 활성화
        document.getElementById('confirm-topic-btn').disabled = false;
    }

    // 게임 시작
    async startGame() {
        console.log('게임 시작 시도...');
        console.log('선택된 주제:', this.selectedTopic);
        console.log('로컬 키워드:', this.localKeywords);
        
        if (!this.selectedTopic) {
            alert('주제를 선택해주세요.');
            return;
        }

        // roomManager가 초기화되었는지 확인
        if (!roomManager) {
            console.error('RoomManager가 초기화되지 않았습니다.');
            alert('Firebase 연결에 문제가 있습니다. 페이지를 새로고침해주세요.');
            return;
        }

        try {
            // 라이어 선정
            const liarIndex = Math.floor(Math.random() * this.players.length);
            const liar = this.players[liarIndex];
            console.log('선택된 라이어:', liar);

            // 키워드 설정 (로컬 키워드 데이터 사용)
            const topicKeywords = this.localKeywords[this.selectedTopic] || this.localKeywords.general;
            console.log('주제 키워드:', topicKeywords);
            
            if (!topicKeywords) {
                throw new Error(`주제 '${this.selectedTopic}'에 대한 키워드를 찾을 수 없습니다.`);
            }
            
            const normalKeyword = topicKeywords.normal[Math.floor(Math.random() * topicKeywords.normal.length)];
            const liarKeyword = topicKeywords.liar[Math.floor(Math.random() * topicKeywords.liar.length)];
            console.log('선택된 키워드:', { normal: normalKeyword, liar: liarKeyword });

            // Firebase에 게임 시작 정보 저장
            console.log('Firebase에 게임 시작 정보 저장 중...');
            await roomManager.startGame(this.roomId, this.selectedTopic, liar.name, {
                normal: normalKeyword,
                liar: liarKeyword
            });
            console.log('Firebase 저장 완료');

            // 메시지 구독 시작
            this.startMessageSubscription();
            console.log('게임 시작 완료!');

        } catch (error) {
            console.error('게임 시작 에러:', error);
            alert('게임 시작에 실패했습니다: ' + error.message);
        }
    }

    // 주제 이름 가져오기
    getTopicName(topic) {
        const topicNames = {
            politics: '정치',
            economy: '경제',
            history: '역사',
            general: '상식',
            culture: '문화',
            animals: '동물',
            plants: '식물',
            games: '게임',
            movies: '영화',
            music: '음악',
            all: '전체'
        };
        return topicNames[topic] || topic;
    }

    // 게임 초기화
    initializeGame() {
        // Firebase에서 받은 데이터 사용
        const topicName = this.getTopicName(this.topic);
        const isLiar = this.liar === this.playerName;
        
        // Firebase에서 받은 키워드 데이터 사용
        let myKeyword;
        if (this.keywords && this.keywords.normal && this.keywords.liar) {
            myKeyword = isLiar ? this.keywords.liar : this.keywords.normal;
        } else {
            // 키워드 데이터가 없는 경우 기본값
            myKeyword = isLiar ? '라이어 키워드' : '일반 키워드';
        }
        
        document.getElementById('current-topic').textContent = topicName;
        document.getElementById('my-keyword').textContent = myKeyword;
        
        // 채팅 초기화
        this.messages = [];
        this.updateChatDisplay();
        
        // 시스템 메시지 추가
        this.addSystemMessage(`게임이 시작되었습니다! 주제: ${topicName}`);
        this.addSystemMessage(`당신의 키워드: ${myKeyword}`);
        if (isLiar) {
            this.addSystemMessage('당신은 라이어입니다! 다른 사람들을 속여보세요.');
        }
    }

    // 메시지 전송
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            await roomManager.sendMessage(this.roomId, {
                player: this.playerName,
                content: message,
                timestamp: new Date()
            });

            input.value = '';
        } catch (error) {
            alert('메시지 전송에 실패했습니다: ' + error.message);
        }
    }

    // 채팅에 메시지 추가
    addMessageToChat(message) {
        this.messages.push(message);
        this.updateChatDisplay();
    }

    // 시스템 메시지 추가
    addSystemMessage(content) {
        this.messages.push({
            player: '시스템',
            content: content,
            timestamp: new Date(),
            isSystem: true
        });
        this.updateChatDisplay();
    }

    // 채팅 화면 업데이트
    updateChatDisplay() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.isSystem ? 'system' : ''}`;
            
            if (msg.isSystem) {
                messageDiv.innerHTML = `<div class="message-content" style="color: #666; font-style: italic;">${msg.content}</div>`;
            } else {
                messageDiv.innerHTML = `
                    <div class="player-name">${msg.player}</div>
                    <div class="message-content">${msg.content}</div>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
        });

        // 스크롤을 맨 아래로
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 투표 화면 표시
    showVoteScreen() {
        this.showScreen('vote');
    }

    // 투표 화면 초기화
    initializeVoteScreen() {
        const votePlayers = document.getElementById('vote-players');
        votePlayers.innerHTML = '';

        this.players.forEach(player => {
            if (player.name !== this.playerName) {
                const votePlayer = document.createElement('div');
                votePlayer.className = 'vote-player';
                votePlayer.textContent = player.name;
                votePlayer.addEventListener('click', () => this.selectVote(votePlayer, player.name));
                votePlayers.appendChild(votePlayer);
            }
        });
    }

    // 투표 선택
    selectVote(element, playerName) {
        // 기존 선택 해제
        document.querySelectorAll('.vote-player').forEach(player => {
            player.classList.remove('selected');
        });

        // 새 선택
        element.classList.add('selected');
        this.selectedVote = playerName;
        
        // 투표 확정 버튼 활성화
        document.getElementById('confirm-vote-btn').disabled = false;
    }

    // 투표 확정
    confirmVote() {
        if (!this.selectedVote) return;

        this.votes[this.playerName] = this.selectedVote;
        
        // 투표 결과 계산 (시뮬레이션)
        this.calculateVoteResult();
    }

    // 투표 결과 계산
    calculateVoteResult() {
        // 시뮬레이션을 위한 가상 투표
        const allPlayers = this.players.map(p => p.name);
        const liar = this.gameData.isLiar ? this.playerName : allPlayers[Math.floor(Math.random() * allPlayers.length)];
        
        // 각 플레이어의 투표 시뮬레이션
        this.players.forEach(player => {
            if (player.name !== this.playerName) {
                const randomVote = allPlayers.filter(p => p !== player.name)[Math.floor(Math.random() * (allPlayers.length - 1))];
                this.votes[player.name] = randomVote;
            }
        });

        // 가장 많이 투표받은 사람 찾기
        const voteCounts = {};
        Object.values(this.votes).forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        const maxVotes = Math.max(...Object.values(voteCounts));
        const mostVoted = Object.keys(voteCounts).filter(player => voteCounts[player] === maxVotes);

        // 결과 판정
        const isLiarFound = mostVoted.includes(liar);
        this.showGameResult(isLiarFound, liar);
    }

    // 게임 결과 표시
    showGameResult(isLiarFound, liar) {
        const resultContent = document.getElementById('result-content');
        
        if (isLiarFound) {
            resultContent.innerHTML = `
                <div class="winner">🎉 일반 플레이어 승리! 🎉</div>
                <p>라이어를 성공적으로 찾아냈습니다!</p>
                <div class="liar-info">
                    <strong>라이어:</strong> ${liar}<br>
                    <strong>라이어의 키워드:</strong> ${this.gameData.liarKeyword}
                </div>
                <p>정답 키워드: ${this.gameData.keyword}</p>
            `;
        } else {
            resultContent.innerHTML = `
                <div class="loser">😈 라이어 승리! 😈</div>
                <p>라이어가 성공적으로 속였습니다!</p>
                <div class="liar-info">
                    <strong>라이어:</strong> ${liar}<br>
                    <strong>라이어의 키워드:</strong> ${this.gameData.liarKeyword}
                </div>
                <p>정답 키워드: ${this.gameData.keyword}</p>
            `;
        }

        this.showScreen('result');
    }

    // 게임 종료
    endGame() {
        if (confirm('정말로 게임을 종료하시겠습니까?')) {
            this.showScreen('home');
        }
    }

    // 다시하기
    playAgain() {
        this.selectedTopic = '';
        this.gameData = {};
        this.votes = {};
        this.selectedVote = null;
        this.messages = [];
        
        if (this.isHost) {
            this.showScreen('topic');
        } else {
            this.showScreen('waiting');
        }
    }
}

// 게임 시작
let gameInstance;

document.addEventListener('DOMContentLoaded', () => {
    try {
        gameInstance = new LiarGame();
        console.log('LiarGame 인스턴스 생성 완료');
    } catch (error) {
        console.error('LiarGame 인스턴스 생성 실패:', error);
        alert('게임 초기화에 실패했습니다: ' + error.message);
    }
}); 