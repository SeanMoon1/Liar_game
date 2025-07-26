// API 기반 방 관리 시스템
class RoomManager {
    constructor() {
        this.baseUrl = '/api';
    }

    // 방 생성
    async createRoom(roomCode, hostName) {
        try {
            const response = await fetch(`${this.baseUrl}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomCode, hostName })
            });
            
            const data = await response.json();
            if (data.success) {
                return data.room;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('방 생성 실패:', error);
            return null;
        }
    }

    // 방 참가
    async joinRoom(roomCode, playerName) {
        try {
            const response = await fetch(`${this.baseUrl}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomCode, playerName })
            });
            
            const data = await response.json();
            if (data.success) {
                return data.room;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('방 참가 실패:', error);
            return null;
        }
    }

    // 방 정보 가져오기
    async getRoom(roomCode) {
        try {
            const response = await fetch(`${this.baseUrl}/rooms?roomCode=${roomCode}`);
            const data = await response.json();
            if (data.success) {
                return data.room;
            } else {
                return null;
            }
        } catch (error) {
            console.error('방 정보 조회 실패:', error);
            return null;
        }
    }

    // 플레이어 제거
    async removePlayer(roomCode, playerName) {
        try {
            const response = await fetch(`${this.baseUrl}/join?roomCode=${roomCode}&playerName=${playerName}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('플레이어 제거 실패:', error);
            return false;
        }
    }
}

// 전역 방 매니저 인스턴스
const roomManager = new RoomManager();

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
        this.loadKeywords();
        
        // 주기적으로 방 정보 업데이트
        this.startRoomUpdateInterval();
    }

    // 방 정보 업데이트 인터벌 시작
    startRoomUpdateInterval() {
        setInterval(() => {
            if (this.roomId && this.currentScreen === 'waiting') {
                this.updateRoomInfo();
            }
        }, 2000); // 2초마다 업데이트
    }

    // 방 정보 업데이트
    async updateRoomInfo() {
        const room = await roomManager.getRoom(this.roomId);
        if (room) {
            this.players = room.players;
            this.initializeWaitingRoom();
        } else {
            // 방이 삭제된 경우
            alert('방이 삭제되었습니다.');
            this.leaveRoom();
        }
    }

    // 키워드 데이터 로드
    loadKeywords() {
        this.keywords = {
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
        this.roomId = this.generateRoomId();
        
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
    }

    // 기존 방 참가
    async joinExistingRoom() {
        // 방 매니저에서 방 정보 가져오기
        const room = await roomManager.getRoom(this.roomId);
        if (!room) {
            alert('존재하지 않는 방입니다.');
            this.showScreen('room-select');
            return;
        }
        
        // 방에 참가
        const joinedRoom = await roomManager.joinRoom(this.roomId, this.playerName);
        if (!joinedRoom) {
            alert('방 참가에 실패했습니다. 같은 이름의 플레이어가 있거나 게임이 이미 시작되었을 수 있습니다.');
            this.showScreen('room-select');
            return;
        }
        
        this.isHost = false;
        this.players = joinedRoom.players;
        
        // 방 링크 표시
        const roomLink = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        document.getElementById('share-link').value = roomLink;
        document.getElementById('room-link').classList.remove('hidden');
        
        this.showScreen('waiting');
    }

    // 방 코드 생성 (6자리 특수문자 + 영어 조합)
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 방 코드로 참가
    joinRoomByCode() {
        const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
        if (!roomCode) {
            alert('방 코드를 입력해주세요.');
            return;
        }
        if (roomCode.length !== 6) {
            alert('방 코드는 6자리여야 합니다.');
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
        if (this.roomId && this.playerName) {
            await roomManager.removePlayer(this.roomId, this.playerName);
        }
        
        this.roomId = '';
        this.isHost = false;
        this.players = [];
        this.playerName = '';
        document.getElementById('nickname-input').value = '';
        document.getElementById('room-link').classList.add('hidden');
        document.getElementById('room-link-waiting').classList.add('hidden');
        this.showScreen('home');
    }

    // 주제 선택
    selectTopic(button) {
        // 기존 선택 해제
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 새 선택
        button.classList.add('selected');
        this.selectedTopic = button.dataset.topic;
        
        // 시작 버튼 활성화
        document.getElementById('confirm-topic-btn').disabled = false;
    }

    // 게임 시작
    startGame() {
        if (!this.selectedTopic) {
            alert('주제를 선택해주세요.');
            return;
        }

        // 방 매니저에서 방 정보 업데이트
        const room = roomManager.getRoom(this.roomId);
        if (!room) {
            alert('방을 찾을 수 없습니다.');
            return;
        }

        // 게임 시작 상태로 변경
        room.gameStarted = true;
        room.topic = this.selectedTopic;

        // 라이어 선정
        const liarIndex = Math.floor(Math.random() * this.players.length);
        const liar = this.players[liarIndex];
        room.liar = liar.name;

        // 키워드 설정
        const topicKeywords = this.keywords[this.selectedTopic] || this.keywords.general;
        const normalKeyword = topicKeywords.normal[Math.floor(Math.random() * topicKeywords.normal.length)];
        const liarKeyword = topicKeywords.liar[Math.floor(Math.random() * topicKeywords.liar.length)];

        this.gameData = {
            topic: this.getTopicName(this.selectedTopic),
            keyword: normalKeyword,
            isLiar: liar.name === this.playerName,
            liarKeyword: liarKeyword
        };

        this.showScreen('game');
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
        document.getElementById('current-topic').textContent = this.gameData.topic;
        document.getElementById('my-keyword').textContent = this.gameData.isLiar ? this.gameData.liarKeyword : this.gameData.keyword;
        
        // 채팅 초기화
        this.messages = [];
        this.updateChatDisplay();
        
        // 시스템 메시지 추가
        this.addSystemMessage(`게임이 시작되었습니다! 주제: ${this.gameData.topic}`);
        this.addSystemMessage(`당신의 키워드: ${this.gameData.isLiar ? this.gameData.liarKeyword : this.gameData.keyword}`);
        if (this.gameData.isLiar) {
            this.addSystemMessage('당신은 라이어입니다! 다른 사람들을 속여보세요.');
        }
    }

    // 메시지 전송
    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.messages.push({
            player: this.playerName,
            content: message,
            timestamp: new Date()
        });

        input.value = '';
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
document.addEventListener('DOMContentLoaded', () => {
    new LiarGame();
}); 