const UserView = {
    currentStep: 0,
    answers: {},
    survey: null,

    render(container) {
        const cafeteriaId = sessionStorage.getItem('cafeteriaId');

        // Find assigned survey
        const cafeterias = DataService.getCafeterias();
        const cafeteria = cafeterias.find(c => c.id === cafeteriaId);

        let assignedSurveyId = null;
        if (cafeteria && cafeteria.assignedSurveyId) {
            assignedSurveyId = cafeteria.assignedSurveyId;
        }

        const surveys = DataService.getSurveys();
        // Fallback to first survey if assignment missing or invalid
        this.survey = surveys.find(s => s.id === assignedSurveyId) || surveys[0];

        this.currentStep = 0;
        this.answers = {};

        container.innerHTML = `
            <div id="user-view-container" style="height: 100%; overflow: hidden; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); position: relative;">
                <header style="position: absolute; top: 0; left: 0; width: 100%; padding: 20px; z-index: 10; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 1.2em; color: #636E72; font-weight: bold;">
                        <i class="ph ph-storefront"></i> 食堂番号: ${cafeteriaId}
                    </div>
                    <button onclick="App.logout()" class="btn" style="background: rgba(255,255,255,0.5); color: #636E72; padding: 5px 15px; font-size: 0.9em; border: 1px solid #ccc;">
                        <i class="ph ph-sign-out"></i> ログアウト
                    </button>
                </header>

                <div id="step-container" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; transition: transform 0.3s ease;">
                    <!-- Content injected here -->
                </div>
            </div>
        `;

        // If no survey at all (deleted?), show error
        if (!this.survey) {
            document.getElementById('step-container').innerHTML = '<h2>アンケートが設定されていません。</h2>';
            return;
        }

        this.renderStep();
    },

    renderStep() {
        const container = document.getElementById('step-container');
        if (!container) return;

        const q = this.survey.questions[this.currentStep];

        let content = `
            <div class="step-content" style="width: 100%; max-width: 600px; text-align: center; animation: slideInRight 0.5s ease;">
                <div style="margin-bottom: 20px; color: #b2bec3; font-weight: bold;">
                    QUESTION ${this.currentStep + 1} / ${this.survey.questions.length}
                </div>
                <h1 style="color: #2D3436; margin-bottom: 40px; font-size: 2.5em;">${q.text}</h1>
                
                <form onsubmit="return false;" style="display: flex; flex-direction: column; align-items: center; gap: 40px;">
        `;

        if (q.type === 'rating') {
            content += `
                <div class="rating-group">
                    ${[1, 2, 3, 4, 5].map(v => `
                        <input type="radio" name="${q.id}" id="${q.id}-${v}" value="${v}" class="hidden" onchange="UserView.handleInput('${q.id}', '${v}')">
                        <label for="${q.id}-${v}" class="rating-star">
                            <i class="ph-fill ph-star"></i>
                            <span>${v}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (q.type === 'yesno') {
            content += `
                <div class="yesno-group" style="display: flex; gap: 20px; justify-content: center;">
                    <input type="radio" name="${q.id}" id="${q.id}-yes" value="yes" class="hidden" onchange="UserView.handleInput('${q.id}', 'yes')">
                    <label for="${q.id}-yes" class="pop-btn yes-btn">
                        <i class="ph-bold ph-thumbs-up"></i> はい
                    </label>

                    <input type="radio" name="${q.id}" id="${q.id}-no" value="no" class="hidden" onchange="UserView.handleInput('${q.id}', 'no')">
                    <label for="${q.id}-no" class="pop-btn no-btn">
                        <i class="ph-bold ph-thumbs-down"></i> いいえ
                    </label>
                </div>
            `;
        } else if (q.type === 'text') {
            content += `
                <textarea id="input-${q.id}" placeholder="自由に入力してください..." style="width: 100%; border: 2px solid #eee; border-radius: 12px; padding: 15px; font-size: 1.2em; min-height: 150px; resize: none; display: block;"></textarea>
                <button onclick="UserView.handleTextInput('${q.id}')" class="btn btn-primary" style="padding: 15px 40px; font-size: 1.2em;">次へ</button>
            `;
        } else if (q.type === 'checkbox') {
            const maxSelect = q.maxSelections || 0;
            const maxText = maxSelect > 0 ? `<div style="margin-bottom:10px; color:#e17055; font-weight:bold;">※ ${maxSelect}つまで選択できます</div>` : '';

            content += `
                ${maxText}
                <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                    ${(q.options || []).map((opt, i) => `
                        <label class="checkbox-pop">
                            <input type="checkbox" name="${q.id}" value="${opt}" class="hidden" onchange="UserView.handleCheckboxLimit('${q.id}', ${maxSelect})">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="UserView.handleCheckboxInput('${q.id}')" class="btn btn-primary" style="margin-top: 30px; padding: 15px 40px; font-size: 1.2em;">次へ</button>
             `;
        }

        content += `</form></div>`;
        container.innerHTML = content;
    },

    handleInput(qId, value) {
        this.answers[qId] = value;
        this.nextStep();
    },

    handleTextInput(qId) {
        const val = document.getElementById(`input-${qId}`).value;
        this.answers[qId] = val;
        this.nextStep();
    },

    handleCheckboxLimit(qId, limit) {
        if (limit <= 0) return;

        const checkboxes = document.querySelectorAll(`input[name="${qId}"]`);
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

        if (checkedCount >= limit) {
            checkboxes.forEach(cb => {
                if (!cb.checked) cb.disabled = true;
            });
        } else {
            checkboxes.forEach(cb => cb.disabled = false);
        }
    },

    handleCheckboxInput(qId) {
        const checkboxes = document.querySelectorAll(`input[name="${qId}"]:checked`);
        const values = Array.from(checkboxes).map(cb => cb.value);
        this.answers[qId] = values;
        this.nextStep();
    },

    nextStep() {
        if (this.currentStep < this.survey.questions.length - 1) {
            // Animate Out
            const container = document.querySelector('.step-content');
            container.style.animation = 'slideOutLeft 0.5s ease forwards';

            setTimeout(() => {
                this.currentStep++;
                this.renderStep();
            }, 500);
        } else {
            this.submit();
        }
    },

    submit() {
        const cafeteriaId = sessionStorage.getItem('cafeteriaId');
        DataService.submitResponse({
            cafeteriaId,
            surveyId: this.survey.id, // Save surveyId used
            answers: this.answers
        });

        const container = document.getElementById('step-container');
        container.innerHTML = `
            <div style="text-align: center; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="background: white; padding: 40px; border-radius: 50%; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 0 auto 30px auto;">
                    <i class="ph-fill ph-check-circle" style="font-size: 6em; color: #00b894;"></i>
                </div>
                <h1 style="font-size: 3em; margin-bottom: 10px;">ありがとうございました！</h1>
                <p style="font-size: 1.2em; color: #636E72;">回答を受け付けました。</p>
                <p style="margin-top: 20px; color: #aaa;">3秒後にトップへ戻ります...</p>
            </div>
        `;

        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
};
