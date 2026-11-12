const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');

let currentInput = '0';
let shouldResetScreen = false;
let openBrackets = 0;

function updateScreen() {
    resultEl.innerText = currentInput;
}

// Nhập số, hỗ trợ cả ký hiệu mũ ^ 
function appendNumber(num) {
    if (currentInput === '0' || shouldResetScreen) {
        if (num === '.') {
            currentInput = '0.';
        } else {
            currentInput = num;
        }
        shouldResetScreen = false;
    } else {
        if (num === '.' && currentInput.slice(-1) === '.') return;
        currentInput += num;
    }
    updateScreen();
}

// Nhập phép toán (+ - * /)
function appendOperator(op) {
    shouldResetScreen = false;
    const lastChar = currentInput.slice(-1);
    
    if (['+', '-', '*', '/'].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1) + op;
    } else {
        currentInput += op;
    }
    updateScreen();
}

function clearAll() {
    currentInput = '0';
    historyEl.innerText = '';
    openBrackets = 0;
    shouldResetScreen = false;
    updateScreen();
}

function backspace() {
    if (shouldResetScreen) return;
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateScreen();
}

function applyPercent() {
    try {
        currentInput = (parseFloat(currentInput) / 100).toString();
        updateScreen();
    } catch {
        currentInput = 'Dạng vô định';
        updateScreen();
    }
}

function appendBrackets() {
    const lastChar = currentInput.slice(-1);
    if (currentInput === '0' || ['+', '-', '*', '/'].includes(lastChar)) {
        currentInput = currentInput === '0' ? '(' : currentInput + '(';
        openBrackets++;
    } else if (openBrackets > 0 && !['(', '+', '-', '*', '/'].includes(lastChar)) {
        currentInput += ')';
        openBrackets--;
    } else {
        currentInput += '*(';
        openBrackets++;
    }
    updateScreen();
}

// ========================================================
// KHU VỰC XỬ LÝ GIẢI TÍCH & IEEE 754 (THE CORE)
// ========================================================
function calculateResult() {
    try {
        historyEl.innerText = currentInput;

        while (openBrackets > 0) {
            currentInput += ')';
            openBrackets--;
        }

        // Hỗ trợ tính lũy thừa nếu nhập dấu ^ (chuyển thành ** của JS)
        let sanitizeExpr = currentInput.replace(/\^/g, '**');

        // Thực thi biểu thức
        const evaluated = Function(`'use strict'; return (${sanitizeExpr})`)();

        // 1. XỬ LÝ CÁC DẠNG GIẢI TÍCH (CHIA CHO 0)
        if (evaluated === Infinity) {
            currentInput = '∞'; // Dương vô cực
        } else if (evaluated === -Infinity) {
            currentInput = '-∞'; // Âm vô cực
        } else if (Number.isNaN(evaluated)) {
            currentInput = 'Dạng vô định'; // 0/0 hoặc vô cực trừ vô cực
        } 
        // 2. XỬ LÝ SỐ MŨ KHỦNG (10^100 hoặc 10^-100) VƯỢT MẶT CASIO
        else if (typeof evaluated === 'number') {
            // Nếu là số cực lớn (>= 1e15) hoặc số cực nhỏ (<= 1e-6) nhưng khác 0
            if (Math.abs(evaluated) >= 1e15 || (Math.abs(evaluated) <= 1e-6 && evaluated !== 0)) {
                // Giữ nguyên format khoa học: 1e+100, 1e-100 sạch đẹp
                currentInput = evaluated.toString();
            } else {
                // Khử lỗi số thực dấu phẩy động 0.1 + 0.2 = 0.30000000000000004
                currentInput = parseFloat(evaluated.toFixed(10)).toString();
            }
        }

        shouldResetScreen = true;
        updateScreen();
    } catch (e) {
        // Chỉ hiện lỗi khi cú pháp ngoặc hoặc toán tử gõ sai be bét
        currentInput = 'Lỗi cú pháp';
        shouldResetScreen = true;
        updateScreen();
    }
}

// Lắng nghe sự kiện
document.querySelectorAll('.btn-num').forEach(btn => {
    btn.addEventListener('click', () => appendNumber(btn.dataset.num));
});

document.querySelectorAll('.btn-op').forEach(btn => {
    btn.addEventListener('click', () => appendOperator(btn.dataset.op));
});

document.querySelectorAll('.btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'clear') clearAll();
        if (action === 'backspace') backspace();
        if (action === 'percent') applyPercent();
        if (action === 'brackets') appendBrackets();
    });
});

document.getElementById('btn-equals').addEventListener('click', calculateResult);