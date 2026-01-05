/**
 * Logic for ConfirmForm
 */

// Configuration
// ==========================================
// Replace this URL with your deployed Google Apps Script Web App URL
const GAS_API_URL = 'YOUR_GAS_WEB_APP_URL_HERE';
// ==========================================

// Global State
const inputData = {
    name: '',
    email: ''
};

// DOM Elements
const screens = {
    0: document.getElementById('screen-0'),
    1: document.getElementById('screen-1'),
    2: document.getElementById('screen-2'),
    3: document.getElementById('screen-3'),
    4: document.getElementById('screen-4'),
    5: document.getElementById('screen-5')
};

/**
 * Navigate to Screen 1 (Validation & Setup)
 */
function goToScreen1() {
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const errorMsg = document.getElementById('error-msg-0');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    // Simple Validation
    if (!name || !email) {
        errorMsg.textContent = 'お名前とメールアドレスを入力してください。';
        return;
    }
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        errorMsg.textContent = '正しいメールアドレス形式で入力してください。';
        return;
    }

    // Save Data
    inputData.name = name;
    inputData.email = email;
    errorMsg.textContent = '';

    // Update Name Placeholders across the app
    document.querySelectorAll('.dynamic-name').forEach(el => {
        el.textContent = name;
    });

    nextScreen(1);
}

/**
 * General Screen Navigation
 * @param {number} screenId 
 */
function nextScreen(screenId) {
    // Hide all screens
    Object.values(screens).forEach(el => {
        el.classList.remove('active');
        // Optional: wait for animation? simplified here.
    });

    // Show target screen
    const target = screens[screenId];
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Screen 3: Consultation Alert Logic
 */
function showConsultationAlert() {
    Swal.fire({
        title: '窓口が大変混雑しております',
        html: '現在、ご相談窓口は予約が殺到しており、<br>ご回答までに<b>約2ヶ月以上</b>のお時間を頂戴しております。<br><br>期間限定の特典（メンテナンス優待）は、<br><u>期間終了とともに失効する可能性</u>がございます。<br><br>確実な「あんしんサポート」を確保いただくため、<br>推奨プランでの合意を強くお勧めいたします。',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981', // Green
        cancelButtonColor: '#666',
        confirmButtonText: '推奨プラン（和解・合意）に進む',
        cancelButtonText: 'それでも相談する'
    }).then((result) => {
        if (result.isConfirmed) {
            nextScreen(4);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Loop back or show another message?
            // Re-prompt to encourage agreement as per specs
            Swal.fire({
                title: 'ご確認',
                text: '誠に恐れ入りますが、サポート品質維持のため、原則としてWEB上での手続きをお願いしております。推奨プランにて進めてよろしいでしょうか？',
                icon: 'question',
                confirmButtonText: 'はい、手続きを進める'
            }).then(() => {
                nextScreen(4);
            });
        }
    });
}

/**
 * Screen 4: Submit to Backend
 */
function submitAgreement() {
    if (GAS_API_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        Swal.fire('システム設定未完了', 'GASのWebhook URLが設定されていません。管理者に連絡してください。', 'error');
        return;
    }

    const btn = document.querySelector('.btn-confirm');
    const spinner = document.getElementById('loading-spinner');

    // UI Loading State
    btn.disabled = true;
    btn.style.opacity = 0.6;
    spinner.classList.remove('hidden');

    // Payload
    const payload = {
        name: inputData.name,
        email: inputData.email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };

    // Send Request
    fetch(GAS_API_URL, {
        method: 'POST',
        // 'no-cors' mode is often used for GAS Simple Triggers but returns opaque response.
        // For 'Web App' executed as 'Me', standard CORS usually works if GAS function outputs headers correctly.
        // If strict CORS issues arise, 'no-cors' can be used, but we won't see the response JSON.
        // We'll try standard CORS first. If GAS script has headers, it works.
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' // GAS plays nicer with this or text/plain sometimes
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            // If using standard CORS and validation passed
            return response.json();
        })
        .then(data => {
            if (data && data.status === 'success') {
                nextScreen(5);
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Submission Error:', error);

            // Fallback for 'no-cors' scenarios or network blips:
            // Sometimes GAS returns 200 but CORS fails header check in browser.
            // If it really failed, we might want to retry. 
            // For this demo, let's assume if it's a CORS syntax error, it might have actually succeeded in GAS.
            // But to be safe, show error.

            Swal.fire({
                title: '送信エラー',
                text: '通信状況の良い場所で再度お試しください。 (' + error.message + ')',
                icon: 'error'
            });

            // Reset UI
            btn.disabled = false;
            btn.style.opacity = 1;
            spinner.classList.add('hidden');
        });
}
