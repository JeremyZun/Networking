// 應用程式狀態
let currentQuestionIndex = 0;
let userAnswers = [];
let score = {
    correct: 0,
    incorrect: 0
};
let currentMode = 'practice'; // 'practice' 或 'exam'
let examQuestions = [];
let examTimer = null;
let examTimeLeft = 50 * 60;
let isExamSubmitted = false; // 新增：考試是否已交卷

// DOM 元素
const questionIdElement = document.getElementById('question-id');
const questionSourceElement = document.getElementById('question-source');
const questionTextElement = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const answerFeedbackElement = document.getElementById('answer-feedback');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const showAnswerButton = document.getElementById('show-answer-btn');
const resetButton = document.getElementById('reset-btn');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
const correctCountElement = document.getElementById('correct-count');
const incorrectCountElement = document.getElementById('incorrect-count');
const accuracyElement = document.getElementById('accuracy');
const helpButton = document.getElementById('help-btn');
const modal = document.getElementById('keyboard-help-modal');
const closeModal = document.querySelector('.close');
const submitExamButton = document.getElementById('submit-exam-btn');

// 事件監聽器
prevButton.addEventListener('click', goToPreviousQuestion);
nextButton.addEventListener('click', goToNextQuestion);
showAnswerButton.addEventListener('click', showAnswer);
resetButton.addEventListener('click', resetQuiz);
helpButton.addEventListener('click', showHelpModal);
closeModal.addEventListener('click', hideHelpModal);

// 模式選擇事件監聽器
document.getElementById('practice-mode-btn').addEventListener('click', switchToPracticeMode);
document.getElementById('exam-mode-btn').addEventListener('click', startExamMode);

// 初始化應用程式
function init() {
    totalQuestionsElement.textContent = questions.length;
    updateStats();
    loadQuestion(currentQuestionIndex);
    
    // 事件監聽器
    prevButton.addEventListener('click', goToPreviousQuestion);
    nextButton.addEventListener('click', goToNextQuestion);
    showAnswerButton.addEventListener('click', showAnswer);
    resetButton.addEventListener('click', resetQuiz);
    helpButton.addEventListener('click', showHelpModal);
    closeModal.addEventListener('click', hideHelpModal);
    
    // 模式選擇事件監聽器
    document.getElementById('practice-mode-btn').addEventListener('click', switchToPracticeMode);
    document.getElementById('exam-mode-btn').addEventListener('click', startExamMode);
    
    // 初始化視覺模式
    updateVisualMode();
    updateModeButtons();
    
    // 點擊模態框外部關閉
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideHelpModal();
        }
    });
    
    // 鍵盤事件監聽
    document.addEventListener('keydown', handleKeyDown);
}

// 處理鍵盤事件
function handleKeyDown(event) {
    // 如果正在輸入文字，不處理快捷鍵
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const question = currentMode === 'exam' ? examQuestions[currentQuestionIndex] : questions[currentQuestionIndex];
    
    switch(event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
            // 選擇答案 A-D
            if (question.type !== 'truefalse' && question.type !== 'matching') {
                const optionIndex = parseInt(event.key) - 1;
                if (optionIndex < question.options.length) {
                    const optionElement = document.querySelectorAll('.option')[optionIndex];
                    if (optionElement) {
                        selectOption(optionElement, currentQuestionIndex);
                    }
                }
            }
            break;
            
        case 'y':
        case 'Y':
            // 是非題選擇「是」
            if (question.type === 'truefalse') {
                const optionElement = document.querySelector('[data-option="是"]');
                if (optionElement) {
                    selectOption(optionElement, currentQuestionIndex);
                }
            }
            break;
            
        case 'n':
        case 'N':
            // 是非題選擇「否」
            if (question.type === 'truefalse') {
                const optionElement = document.querySelector('[data-option="否"]');
                if (optionElement) {
                    selectOption(optionElement, currentQuestionIndex);
                }
            }
            break;
            
        case 'ArrowLeft':
        case 'p':
        case 'P':
            // 上一題
            if (!prevButton.disabled) {
                goToPreviousQuestion();
            }
            break;
            
        case 'ArrowRight':
        case 'n':
        case 'N':
            // 下一題
            if (!nextButton.disabled) {
                goToNextQuestion();
            }
            break;
            
        case 'a':
        case 'A':
            // 顯示答案
            showAnswer();
            break;
            
        case 'r':
        case 'R':
            // 重新開始
            resetQuiz();
            break;
            
        case '?':
            // 顯示幫助
            showHelpModal();
            break;
            
        case 'Escape':
            // 隱藏幫助
            hideHelpModal();
            break;

        case 's':
        case 'S':
            // 交卷（僅在考試模式下有效）
            if (currentMode === 'exam' && !isExamSubmitted) {
                submitExam();
            }
            break;
    }
}

// 顯示幫助模態框
function showHelpModal() {
    modal.style.display = 'block';
}

// 隱藏幫助模態框
function hideHelpModal() {
    modal.style.display = 'none';
}

// 載入題目
function loadQuestion(index) {
    const question = currentMode === 'exam' ? examQuestions[index] : questions[index];
    
    // 更新題目資訊
    questionIdElement.textContent = `題目 ${currentMode === 'exam' ? index + 1 : question.id}`;
    questionSourceElement.textContent = question.source || '';
    questionTextElement.textContent = question.question;
    
    // 更新導航按鈕狀態
    const totalQuestions = currentMode === 'exam' ? examQuestions.length : questions.length;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === totalQuestions - 1;
    
    // 更新當前題目顯示
    currentQuestionElement.textContent = index + 1;
    totalQuestionsElement.textContent = totalQuestions;
    
    // 清除選項容器
    optionsContainer.innerHTML = '';
    
    // 清除回饋
    answerFeedbackElement.className = 'answer-feedback';
    answerFeedbackElement.textContent = '';
    
    // 如果是選擇題，生成選項
    if (question.type !== 'truefalse' && question.type !== 'matching') {
        question.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('button');
            optionElement.className = 'option';
            
            // 添加鍵盤快捷鍵提示
            const keyElement = document.createElement('span');
            keyElement.className = 'option-key';
            keyElement.textContent = optionIndex + 1;
            
            const textElement = document.createElement('span');
            textElement.textContent = option;
            
            optionElement.appendChild(keyElement);
            optionElement.appendChild(textElement);
            
            optionElement.dataset.option = option.charAt(1); // 提取 A, B, C, D
            
            // 檢查是否已經回答過這題
            if (userAnswers[index] !== undefined) {
                if (optionElement.dataset.option === userAnswers[index].selected) {
                    optionElement.classList.add('selected');
                    
                    // 在檢視模式或練習模式下顯示正確/錯誤狀態
                    if (isExamSubmitted || currentMode === 'practice') {
                        if (userAnswers[index].isCorrect) {
                            optionElement.classList.add('correct');
                        } else {
                            optionElement.classList.add('incorrect');
                            
                            // 同時顯示正確答案
                            const correctOption = document.querySelector(`[data-option="${question.answer}"]`);
                            if (correctOption) {
                                correctOption.classList.add('correct');
                            }
                        }
                    }
                } else if ((isExamSubmitted || currentMode === 'practice') && optionElement.dataset.option === question.answer) {
                    // 在檢視模式下顯示正確答案
                    optionElement.classList.add('correct');
                }
            }
            
            optionElement.addEventListener('click', () => selectOption(optionElement, index));
            optionsContainer.appendChild(optionElement);
        });
    } else if (question.type === 'truefalse') {
        // 是非題
        const trueOption = document.createElement('button');
        trueOption.className = 'option';
        
        const trueKey = document.createElement('span');
        trueKey.className = 'option-key';
        trueKey.textContent = 'Y';
        
        const trueText = document.createElement('span');
        trueText.textContent = '是';
        
        trueOption.appendChild(trueKey);
        trueOption.appendChild(trueText);
        trueOption.dataset.option = '是';
        
        const falseOption = document.createElement('button');
        falseOption.className = 'option';
        
        const falseKey = document.createElement('span');
        falseKey.className = 'option-key';
        falseKey.textContent = 'N';
        
        const falseText = document.createElement('span');
        falseText.textContent = '否';
        
        falseOption.appendChild(falseKey);
        falseOption.appendChild(falseText);
        falseOption.dataset.option = '否';
        
        // 檢查是否已經回答過這題
        if (userAnswers[index] !== undefined) {
            if (userAnswers[index].selected === '是') {
                trueOption.classList.add('selected');
            } else if (userAnswers[index].selected === '否') {
                falseOption.classList.add('selected');
            }
            
            // 顯示正確/錯誤狀態
            if (userAnswers[index].selected === question.answer) {
                if (userAnswers[index].selected === '是') {
                    trueOption.classList.add('correct');
                } else {
                    falseOption.classList.add('correct');
                }
            } else {
                if (userAnswers[index].selected === '是') {
                    trueOption.classList.add('incorrect');
                } else {
                    falseOption.classList.add('incorrect');
                }
                
                // 顯示正確答案
                if (question.answer === '是') {
                    trueOption.classList.add('correct');
                } else {
                    falseOption.classList.add('correct');
                }
            }
            
            // 顯示回饋
            showFeedback(index);
        }
        
        trueOption.addEventListener('click', () => selectOption(trueOption, index));
        falseOption.addEventListener('click', () => selectOption(falseOption, index));
        
        optionsContainer.appendChild(trueOption);
        optionsContainer.appendChild(falseOption);
    } else if (question.type === 'matching') {
        // 配對題
        const matchingContainer = document.createElement('div');
        matchingContainer.className = 'matching-container';
        
        question.pairs.forEach((pair, pairIndex) => {
            const pairElement = document.createElement('div');
            pairElement.className = 'matching-pair';
            pairElement.innerHTML = `
                <span class="matching-left">${pair.left}</span>
                <span class="matching-arrow">→</span>
                <span class="matching-right">${pair.right}</span>
            `;
            matchingContainer.appendChild(pairElement);
        });
        
        optionsContainer.appendChild(matchingContainer);
        
        // 對於配對題，我們不提供選擇功能，只顯示答案
        if (userAnswers[index] !== undefined) {
            showFeedback(index);
        }
    }
}

// 顯示回饋
function showFeedback(questionIndex) {
    // 在考試模式下且未交卷時不顯示回饋
    if (currentMode === 'exam' && !isExamSubmitted) {
        return;
    }
    
    const question = currentMode === 'exam' ? examQuestions[questionIndex] : questions[questionIndex];
    const userAnswer = userAnswers[questionIndex];
    
    if (!userAnswer) return;
    
    answerFeedbackElement.className = 'answer-feedback';
    
    if (userAnswer.isCorrect) {
        answerFeedbackElement.classList.add('correct');
        answerFeedbackElement.textContent = '正確！';
    } else {
        answerFeedbackElement.classList.add('incorrect');
        
        if (question.type === 'truefalse') {
            answerFeedbackElement.textContent = `錯誤！正確答案是：${question.answer}`;
        } else if (question.type !== 'matching') {
            answerFeedbackElement.textContent = `錯誤！正確答案是：${question.answer}`;
        } else {
            answerFeedbackElement.textContent = '這是配對題，請參考上方配對內容。';
        }
    }
}

// 顯示答案
function showAnswer() {
    const question = questions[currentQuestionIndex];
    
    if (currentMode === 'exam') {
        alert('模擬考模式下無法顯示答案');
        return;
    }

    // 如果已經回答過，不需要再次顯示
    if (userAnswers[currentQuestionIndex] !== undefined) {
        return;
    }
    
    // 標記正確答案
    if (question.type !== 'truefalse' && question.type !== 'matching') {
        const correctOption = document.querySelector(`[data-option="${question.answer}"]`);
        if (correctOption) {
            correctOption.classList.add('correct');
        }
    } else if (question.type === 'truefalse') {
        const correctOption = document.querySelector(`[data-option="${question.answer}"]`);
        if (correctOption) {
            correctOption.classList.add('correct');
        }
    }
    
    // 顯示回饋
    answerFeedbackElement.className = 'answer-feedback correct';
    answerFeedbackElement.textContent = `正確答案是：${question.answer}`;
    
    // 記錄為已回答但不計分
    userAnswers[currentQuestionIndex] = {
        selected: null,
        isCorrect: false,
        skipped: true
    };
}

// 前往上一題
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
}

// 前往下一題
function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }
}

// 更新統計數據
function updateStats() {
    correctCountElement.textContent = score.correct;
    incorrectCountElement.textContent = score.incorrect;
    
    const totalAnswered = score.correct + score.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((score.correct / totalAnswered) * 100) : 0;
    accuracyElement.textContent = `${accuracy}%`;
}

// 重置測驗
function resetQuiz() {
    if (currentMode === 'exam') {
        if (confirm('確定要結束當前模擬考嗎？考試進度將會遺失。')) {
            stopExamTimer();
            switchToPracticeMode();
        }
        return;
    }
    
    if (confirm('確定要重新開始測驗嗎？這將清除所有答題記錄。')) {
        currentQuestionIndex = 0;
        userAnswers = [];
        score = {
            correct: 0,
            incorrect: 0
        };
        isExamSubmitted = false;
        
        updateStats();
        loadQuestion(currentQuestionIndex);
    }
}

// 切換到練習模式
function switchToPracticeMode() {
    if (currentMode === 'practice') return;
    
    // 停止考試計時器
    stopExamTimer();
    hideExamTimer();
    
    // 重置狀態
    currentMode = 'practice';
    currentQuestionIndex = 0;
    userAnswers = [];
    score = {
        correct: 0,
        incorrect: 0
    };
    isExamSubmitted = false;
    
    // 更新UI
    updateModeButtons();
    updateVisualMode();
    
    // 隱藏交卷按鈕，顯示顯示答案按鈕
    submitExamButton.style.display = 'none';
    showAnswerButton.style.display = 'block';
    
    // 重置交卷按鈕狀態
    submitExamButton.disabled = false;
    submitExamButton.textContent = '交卷 (S)';
    
    // 移除檢視模式類名
    document.querySelector('.container').classList.remove('review-mode');
    
    // 載入第一題
    loadQuestion(currentQuestionIndex);
    updateStats();
}

// 切換到練習模式
function selectOption(optionElement, questionIndex) {
    const question = currentMode === 'exam' ? examQuestions[questionIndex] : questions[questionIndex];
    
    // 如果已經交卷或是練習模式下已經回答過，不允許再次選擇
    if ((currentMode === 'exam' && isExamSubmitted) || userAnswers[questionIndex] !== undefined) {
        return;
    }
    
    // 移除其他選項的選中狀態
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // 標記選中的選項
    optionElement.classList.add('selected');
    
    // 記錄用戶答案
    const selectedOption = optionElement.dataset.option;
    userAnswers[questionIndex] = {
        selected: selectedOption,
        isCorrect: selectedOption === question.answer
    };
    
    // 在練習模式下立即顯示結果，考試模式下只記錄答案
    if (currentMode === 'practice') {
        if (selectedOption === question.answer) {
            score.correct++;
            optionElement.classList.add('correct');
        } else {
            score.incorrect++;
            optionElement.classList.add('incorrect');
            
            // 顯示正確答案
            const correctOption = document.querySelector(`[data-option="${question.answer}"]`);
            if (correctOption) {
                correctOption.classList.add('correct');
            }
        }
        
        // 顯示回饋
        showFeedback(questionIndex);
        
        // 更新統計數據
        updateStats();
    } else {
        // 考試模式下只記錄答案，不顯示對錯
        // 更新統計數據但不顯示正確/錯誤
        updateStats();
    }
}

// 模式相關函數
function updateModeButtons() {
    const practiceBtn = document.getElementById('practice-mode-btn');
    const examBtn = document.getElementById('exam-mode-btn');
    
    practiceBtn.classList.toggle('active', currentMode === 'practice');
    examBtn.classList.toggle('active', currentMode === 'exam');
}

// 開始模擬考模式
function startExamMode() {
    if (currentMode === 'exam') return;
    
    currentMode = 'exam';
    updateModeButtons();
    updateVisualMode();
    initializeExam();
}

// 更新視覺模式提示
function updateVisualMode() {
    const container = document.querySelector('.container');
    const modeIndicator = document.getElementById('current-mode');
    
    container.classList.remove('practice-mode', 'exam-mode');
    container.classList.add(currentMode + '-mode');
    
    if (currentMode === 'practice') {
        modeIndicator.textContent = '練習模式';
        modeIndicator.style.backgroundColor = '#3498db';
    } else {
        modeIndicator.textContent = '模擬考模式';
        modeIndicator.style.backgroundColor = '#e74c3c';
    }
}

// 初始化模擬考
function initializeExam() {
    // 隨機抽取40題
    examQuestions = getRandomQuestions(40);
    
    // 重置狀態
    currentQuestionIndex = 0;
    userAnswers = new Array(examQuestions.length);
    score = { correct: 0, incorrect: 0 };
    isExamSubmitted = false; // 重置交卷狀態
    
    // 初始化考試計時器
    examTimeLeft = 50 * 60;
    startExamTimer();
    showExamTimer();
    
    // 顯示交卷按鈕，隱藏顯示答案按鈕
    submitExamButton.style.display = 'block';
    showAnswerButton.style.display = 'none';
    
    // 載入第一題
    loadQuestion(currentQuestionIndex);
    
    // 添加交卷按鈕事件監聽器
    submitExamButton.onclick = submitExam;
}

// 從題庫隨機抽取題目
function getRandomQuestions(count) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 開始考試計時器
function startExamTimer() {
    updateTimerDisplay();
    
    examTimer = setInterval(() => {
        examTimeLeft--;
        updateTimerDisplay();
        
        if (examTimeLeft <= 0) {
            endExam();
        }
    }, 1000);
}

// 停止考試計時器
function stopExamTimer() {
    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }
}

// 更新計時器顯示
function updateTimerDisplay() {
    const minutes = Math.floor(examTimeLeft / 60);
    const seconds = examTimeLeft % 60;
    
    document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds').textContent = seconds.toString().padStart(2, '0');
    
    // 更新進度條
    const totalTime = 50 * 60;
    const progressPercent = (examTimeLeft / totalTime) * 100;
    const progressBar = document.getElementById('timer-progress-bar');
    
    progressBar.style.width = `${progressPercent}%`;
    
    // 根據剩餘時間改變顏色
    if (progressPercent <= 25) {
        progressBar.className = 'timer-progress-bar danger';
    } else if (progressPercent <= 50) {
        progressBar.className = 'timer-progress-bar warning';
    } else {
        progressBar.className = 'timer-progress-bar';
    }
}

// 顯示考試計時器
function showExamTimer() {
    document.getElementById('exam-timer').style.display = 'block';
}

// 隱藏考試計時器
function hideExamTimer() {
    document.getElementById('exam-timer').style.display = 'none';
    showAnswerButton.style.display = 'block';
}

// 結束考試
function endExam() {
    stopExamTimer();
    
    // 計算分數
    const totalQuestions = examQuestions.length;
    const correctAnswers = examQuestions.reduce((count, question, index) => {
        if (userAnswers[index] && userAnswers[index].selected === question.answer) {
            return count + 1;
        }
        return count;
    }, 0);
    
    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
    
    // 顯示考試結果
    showExamResults(correctAnswers, totalQuestions, scorePercent);
}

// 用於檢視考卷的特殊模式
function enterExamReviewMode() {
    // 停止考試計時器
    stopExamTimer();
    hideExamTimer();
    
    // 保持考試模式但標記為已交卷狀態
    currentMode = 'exam';
    isExamSubmitted = true;
    
    // 更新UI
    updateModeButtons();
    updateVisualMode();
    
    // 隱藏交卷按鈕，顯示顯示答案按鈕（但在考試模式下禁用）
    submitExamButton.style.display = 'none';
    showAnswerButton.style.display = 'block';
    showAnswerButton.disabled = true;
    showAnswerButton.textContent = '考試模式無法顯示答案';
    
    // 添加檢視模式類名
    document.querySelector('.container').classList.add('review-mode');
    
    // 重新載入當前題目以顯示正確答案
    loadQuestion(currentQuestionIndex);
    updateStats();
    
    // 更新模式指示器
    const modeIndicator = document.getElementById('current-mode');
    modeIndicator.textContent = '檢視考卷模式';
    modeIndicator.style.backgroundColor = '#9b59b6'; // 紫色表示檢視模式
}

// 顯示考試結果
function showExamResults() {
    const totalQuestions = examQuestions.length;
    const scorePercent = Math.round((score.correct / totalQuestions) * 100);
    
    const resultsHTML = `
        <div class="exam-results">
            <h2>模擬考結束</h2>
            <div class="exam-score">得分: ${scorePercent}%</div>
            <div class="exam-details">
                <div class="exam-detail-item">
                    <div class="exam-detail-label">答對題數</div>
                    <div class="exam-detail-value">${score.correct} / ${totalQuestions}</div>
                </div>
                <div class="exam-detail-item">
                    <div class="exam-detail-label">正確率</div>
                    <div class="exam-detail-value">${scorePercent}%</div>
                </div>
                <div class="exam-detail-item">
                    <div class="exam-detail-label">考試時間</div>
                    <div class="exam-detail-value">50分鐘</div>
                </div>
                <div class="exam-detail-item">
                    <div class="exam-detail-label">考試模式</div>
                    <div class="exam-detail-value">模擬考</div>
                </div>
            </div>
            <div class="exam-actions">
                <button id="review-exam-btn" class="nav-btn">檢視考卷</button>
                <button id="new-exam-btn" class="nav-btn">重新考試</button>
                <button id="back-to-practice-btn" class="nav-btn">返回練習</button>
            </div>
        </div>
    `;
    
    // 創建結果模態框
    const resultsModal = document.createElement('div');
    resultsModal.className = 'modal';
    resultsModal.id = 'exam-results-modal';
    resultsModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>考試結果</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                ${resultsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(resultsModal);
    
    // 顯示模態框
    resultsModal.style.display = 'block';
    
    // 事件監聽器
    const closeBtn = resultsModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(resultsModal);
        enterExamReviewMode(); // 關閉後自動進入檢視模式
    });
    
    document.getElementById('review-exam-btn').addEventListener('click', () => {
        document.body.removeChild(resultsModal);
        enterExamReviewMode(); // 進入檢視考卷模式
    });
    
    document.getElementById('new-exam-btn').addEventListener('click', () => {
        document.body.removeChild(resultsModal);
        startExamMode(); // 開始新的考試
    });
    
    document.getElementById('back-to-practice-btn').addEventListener('click', () => {
        document.body.removeChild(resultsModal);
        switchToPracticeMode(); // 真正回到練習模式
    });
    
    // 點擊外部關閉
    resultsModal.addEventListener('click', (event) => {
        if (event.target === resultsModal) {
            document.body.removeChild(resultsModal);
            enterExamReviewMode(); // 關閉後自動進入檢視模式
        }
    });
}

// 用於檢視考卷的特殊練習模式切換
function switchToPracticeModeForReview() {
    // 停止考試計時器
    stopExamTimer();
    hideExamTimer();
    
    // 切換到練習模式但保留考試資料
    currentMode = 'practice';
    
    // 更新UI
    updateModeButtons();
    updateVisualMode();
    
    // 隱藏交卷按鈕，顯示顯示答案按鈕
    submitExamButton.style.display = 'none';
    showAnswerButton.style.display = 'block';
    
    // 重置交卷按鈕狀態
    submitExamButton.disabled = false;
    submitExamButton.textContent = '交卷 (S)';
    
    // 移除檢視模式類名
    document.querySelector('.container').classList.remove('review-mode');
    
    // 載入當前題目（顯示考試答案）
    loadQuestion(currentQuestionIndex);
    updateStats();
}

// 交卷函數
function submitExam() {
    if (confirm('確定要交卷嗎？交卷後將無法修改答案。')) {
        stopExamTimer();
        isExamSubmitted = true;
        
        // 計算分數
        calculateExamScore();
        
        // 顯示考試結果
        showExamResults();
        
        // 注意：這裡不再調用 enterReviewMode()，因為 showExamResults() 會處理
    }
}

// 計算考試分數
function calculateExamScore() {
    score.correct = 0;
    score.incorrect = 0;
    
    examQuestions.forEach((question, index) => {
        // 檢查用戶是否有回答這題
        if (userAnswers[index] && userAnswers[index].selected) {
            if (userAnswers[index].selected === question.answer) {
                score.correct++;
                userAnswers[index].isCorrect = true;
            } else {
                score.incorrect++;
                userAnswers[index].isCorrect = false;
            }
        } else {
            // 如果用戶沒有回答這題，計為錯誤
            score.incorrect++;
            // 確保 userAnswers[index] 存在
            if (!userAnswers[index]) {
                userAnswers[index] = {};
            }
            userAnswers[index].isCorrect = false;
            userAnswers[index].selected = null; // 標記為未選擇
        }
    });
}

// 進入檢視模式
function enterReviewMode() {
    // 禁用交卷按鈕
    submitExamButton.disabled = true;
    submitExamButton.textContent = '已交卷';
    
    // 重新載入當前題目以顯示正確答案
    loadQuestion(currentQuestionIndex);
    
    // 添加檢視模式類名
    document.querySelector('.container').classList.add('review-mode');
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', init);