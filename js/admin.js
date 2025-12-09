const AdminView = {
    currentSurveyId: null, // Track currently editing survey

    render(container) {
        container.innerHTML = `
            <div class="admin-layout" style="display: grid; grid-template-columns: 250px 1fr; height: 100%;">
                <aside style="background: #2D3436; color: white; padding: 20px; display: flex; flex-direction: column;">
                    <h2>管理画面</h2>
                    <nav style="margin-top: 40px; flex-grow: 1;">
                        <ul style="list-style: none;">
                            <li style="margin-bottom: 20px;">
                                <a href="#" onclick="AdminView.showEditorSelector(); return false;" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 10px;">
                                    <i class="ph ph-note-pencil" style="font-size: 1.5em;"></i> アンケート設定
                                </a>
                            </li>
                            <li style="margin-bottom: 20px;">
                                <a href="#" onclick="AdminView.showDashboard(); return false;" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 10px;">
                                    <i class="ph ph-chart-bar" style="font-size: 1.5em;"></i> 分析結果
                                </a>
                            </li>
                            <li style="margin-bottom: 20px;">
                                <a href="#" onclick="AdminView.showCafeteriaManager(); return false;" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 10px;">
                                    <i class="ph ph-storefront" style="font-size: 1.5em;"></i> 食堂管理
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <button class="btn btn-secondary" onclick="App.logout()">ログアウト</button>
                </aside>
                <main id="admin-content" style="padding: 40px; overflow-y: auto; background: var(--background);">
                    <!-- Content goes here -->
                </main>
            </div>
        `;
        this.showDashboard();
    },

    // ... (dashboard code remains mostly same but might need survey aggregation updates, skipping for brevity to focus on request) ...
    // Actually need to ensure showDashboard picks a survey or aggregates all?
    // Request says "分析結果は質問事にほしい" (already done) but now we have multiple surveys.
    // Let's just pick the first valid one or all for now, or add survey selector to dashboard.

    showDashboard(cafeteriaFilter = 'all', surveyId = null) {
        const content = document.getElementById('admin-content');
        const allResponses = DataService.getResponses();
        const cafeterias = DataService.getCafeterias();
        const surveys = DataService.getSurveys();

        // Default to first survey if not specified
        if (!surveyId && surveys.length > 0) surveyId = surveys[0].id;
        const activeSurvey = surveys.find(s => s.id === surveyId);

        // Calculate stats specific to this survey
        const surveyResponses = allResponses.filter(r => {
            // We need to know which survey the response belongs to.
            // Currently data logic doesn't store surveyId in response. We should add it or infer it.
            // Inference is hard if questions change. Ideally, DataService.submitResponse should save surveyId.
            // Assuming we update user.js to save surveyId.
            return r.surveyId === surveyId; // Will need to update submit logic
        });

        // Filter by cafeteria
        const responses = cafeteriaFilter === 'all'
            ? surveyResponses
            : surveyResponses.filter(r => r.cafeteriaId === cafeteriaFilter);

        let html = `
             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; white-space: nowrap;">
                <h1>分析結果</h1>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <label>アンケート: </label>
                        <select onchange="AdminView.showDashboard('${cafeteriaFilter}', this.value)" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            ${surveys.map(s => `<option value="${s.id}" ${surveyId === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <label>食堂: </label>
                        <select onchange="AdminView.showDashboard(this.value, '${surveyId}')" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="all" ${cafeteriaFilter === 'all' ? 'selected' : ''}>全て</option>
                            ${cafeterias.map(c => `<option value="${c.id}" ${cafeteriaFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="AdminView.downloadCSV('${surveyId}', '${cafeteriaFilter}')" style="white-space: nowrap;">
                        <i class="ph ph-download-simple"></i> CSV出力
                    </button>
                </div>
            </div>
            
            <div class="card" style="background: white; padding: 20px; border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 40px;">
                <h3>総回答数 (選択中アンケート)</h3>
                <p style="font-size: 3em; font-weight: bold; color: var(--primary);">${responses.length}</p>
            </div>

            <h2>質問別レポート</h2>
            <div style="display: flex; flex-direction: column; gap: 40px; margin-top: 20px;">
        `;

        if (!activeSurvey) {
            content.innerHTML = '<p>アンケートが見つかりません</p>';
            return;
        }

        activeSurvey.questions.forEach((q, index) => {
            html += `<div class="card" style="background: white; padding: 30px; border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin-bottom: 20px; border-left: 5px solid var(--secondary); padding-left: 10px;">Q${index + 1}. ${q.text}</h3>
                <div style="height: 300px;"><canvas id="chart-${q.id}"></canvas></div>`;

            if (q.type === 'text') {
                // Text list
                const textAnswers = responses.map(r => r.answers[q.id]).filter(a => a);
                html += `<div style="max-height: 200px; overflow-y: auto; margin-top: 10px; background: #f9f9f9; padding: 10px;">
                    <ul>${textAnswers.map(a => `<li>${a}</li>`).join('')}</ul>
                 </div>`;
            }
            html += `</div>`;
        });

        html += `</div>`;
        content.innerHTML = html;

        activeSurvey.questions.forEach(q => {
            if (['rating', 'yesno', 'checkbox'].includes(q.type)) {
                this.renderQuestionChart(q, responses);
            }
        });
    },

    // Reuse existing renderQuestionChart...

    renderQuestionChart(question, responses) {
        // ... (Similar to before but handles checkbox properly)
        const ctx = document.getElementById(`chart-${question.id}`);
        if (!ctx) return;

        // Re-implement simplified version for brevity in replacement, essentially same as before
        let labels, data, backgroundColor;
        if (question.type === 'rating') {
            labels = ['1', '2', '3', '4', '5'];
            const counts = [0, 0, 0, 0, 0];
            responses.forEach(r => {
                const val = parseInt(r.answers[question.id]);
                if (val >= 1 && val <= 5) counts[val - 1]++;
            });
            data = counts;
            backgroundColor = '#4ECDC4';
        } else if (question.type === 'yesno') {
            labels = ['はい', 'いいえ'];
            let yes = 0, no = 0;
            responses.forEach(r => {
                const ans = r.answers[question.id];
                if (ans === 'yes') yes++;
                if (ans === 'no') no++;
            });
            data = [yes, no];
            backgroundColor = ['#00b894', '#ff7675'];
        } else if (question.type === 'checkbox') {
            labels = question.options || [];
            data = new Array(labels.length).fill(0);
            responses.forEach(r => {
                const ans = r.answers[question.id];
                if (Array.isArray(ans)) {
                    ans.forEach(a => {
                        const idx = labels.indexOf(a);
                        if (idx !== -1) data[idx]++;
                    });
                }
            });
            backgroundColor = '#a29bfe';
        }

        const existingChart = Chart.getChart(ctx);
        if (existingChart) existingChart.destroy();

        new Chart(ctx, {
            type: question.type === 'yesno' ? 'pie' : 'bar',
            data: {
                labels,
                datasets: [{ label: '回答数', data, backgroundColor }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    },

    showEditorSelector() {
        const content = document.getElementById('admin-content');
        const surveys = DataService.getSurveys();

        content.innerHTML = `
            <h1>アンケート設定</h1>
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="AdminView.createNewSurvey()">＋ 新規アンケート作成</button>
            </div>
            <div style="display: grid; gap: 20px; margin-top: 20px;">
                ${surveys.map(s => `
                    <div class="card" style="padding: 20px; background: white; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">${s.title}</h3>
                        <div>
                             <button class="btn btn-secondary" onclick="AdminView.showEditor('${s.id}')">編集</button>
                             <button class="btn" style="color: red; background: none;" onclick="AdminView.deleteSurvey('${s.id}')">削除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    createNewSurvey() {
        const surveys = DataService.getSurveys();
        const newSurvey = {
            id: 's' + Date.now(),
            title: '新規アンケート',
            questions: []
        };
        surveys.push(newSurvey);
        DataService.saveSurvey(newSurvey);
        this.showEditor(newSurvey.id);
    },

    deleteSurvey(id) {
        if (!confirm('削除しますか？')) return;
        let surveys = DataService.getSurveys();
        // Prevent deleting the last survey to stay safe
        if (surveys.length <= 1) {
            alert('これ以上削除できません');
            return;
        }
        surveys = surveys.filter(s => s.id !== id);
        localStorage.setItem('surveys', JSON.stringify(surveys));
        this.showEditorSelector();
    },

    showEditor(surveyId) {
        if (!surveyId) {
            this.showEditorSelector();
            return;
        }
        this.currentSurveyId = surveyId;
        const surveys = DataService.getSurveys();
        const activeSurvey = surveys.find(s => s.id === surveyId);
        const content = document.getElementById('admin-content');

        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="AdminView.showEditorSelector()" class="btn" style="background: #ccc;">＜ 一覧へ</button>
                    <h1>アンケート設定</h1>
                </div>
                <button class="btn btn-primary" onclick="AdminView.saveSurvey()">保存する</button>
            </div>

            <p style="margin-bottom: 20px; font-size: 0.9em; color: green;">※ 編集は即時プレビューされます。最後に必ず「保存する」を押してください。</p>

            <div class="card" style="background: white; padding: 30px; border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">アンケートタイトル</label>
                    <input type="text" id="survey-title" value="${activeSurvey.title}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1.1em;">
                </div>

                <h3>質問項目</h3>
                <div id="questions-container" style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px;">
                    ${activeSurvey.questions.map((q, index) => this.renderQuestionEditor(q, index)).join('')}
                </div>

                <button class="btn btn-secondary" onclick="AdminView.addQuestion()" style="margin-top: 20px; width: 100%;">
                    <i class="ph ph-plus"></i> 質問を追加
                </button>
            </div>
        `;
    },

    renderQuestionEditor(question, index) {
        let previewHtml = '';
        if (question.type === 'rating') {
            // ... existing rating preview ...
            previewHtml = `
                <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 8px; text-align: center;">
                    <div style="display: flex; gap: 10px; justify-content: center; font-size: 1.5em; color: #dfe6e9;">
                        <span><i class="ph-fill ph-star"></i> 1</span>
                        <span><i class="ph-fill ph-star"></i> 2</span>
                        <span><i class="ph-fill ph-star"></i> 3</span>
                        <span><i class="ph-fill ph-star"></i> 4</span>
                        <span><i class="ph-fill ph-star"></i> 5</span>
                    </div>
                </div>
            `;
        } else if (question.type === 'yesno') {
            previewHtml = `
                <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 8px; display: flex; gap: 20px; justify-content: center;">
                    <button class="btn" style="background: #e0f7fa; color: #00cec9;">はい</button>
                    <button class="btn" style="background: #ffeaa7; color: #fdcb6e;">いいえ</button>
                </div>
            `;
        } else if (question.type === 'text') {
            previewHtml = `
                <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                    <textarea disabled style="width: 100%; resize: none; background: #eee; border: 1px solid #ccc; padding: 8px; border-radius: 4px;">(自由記述欄)</textarea>
                </div>
            `;
        } else if (question.type === 'checkbox') {
            const options = question.options || [];
            // Checkbox specific config for Max Selections
            const maxSelect = question.maxSelections || 0;

            previewHtml = `
                <div style="margin-top: 10px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                    <div style="margin-bottom: 10px;">
                        <label>最大選択数 (0は無制限): </label>
                        <input type="number" min="0" value="${maxSelect}" onchange="AdminView.updateQuestionMaxSelect(${index}, this.value)" style="width: 60px; padding: 5px;">
                    </div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">選択肢管理 (ドラッグで並び替え):</label>
                    <ul style="list-style: none; padding: 0; margin-bottom: 10px;">
                        ${options.map((opt, i) => `
                            <li draggable="true"
                                ondragstart="AdminView.handleOptionDragStart(event, ${index}, ${i})"
                                ondragend="AdminView.handleOptionDragEnd(event)"
                                ondragover="AdminView.handleOptionDragOver(event)"
                                ondrop="AdminView.handleOptionDrop(event, ${index}, ${i})"
                                style="display: flex; gap: 10px; margin-bottom: 5px; cursor: move; border: 1px dashed #ccc; padding: 5px; background: white;">
                                <i class="ph ph-dots-six-vertical" style="color: #ccc;"></i>
                                <input type="text" value="${opt}" onchange="AdminView.updateOption(${index}, ${i}, this.value)" style="flex-grow: 1; padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                                <button onclick="AdminView.removeOption(${index}, ${i})" style="color: red; border: none; background: none; cursor: pointer;"><i class="ph ph-trash"></i></button>
                            </li>
                        `).join('')}
                    </ul>
                    <button onclick="AdminView.addOption(${index})" class="btn" style="padding: 5px 10px; font-size: 0.9em; background: #dfe6e9; color: #636e72;">
                        <i class="ph ph-plus"></i> 選択肢を追加
                    </button>
                </div>
             `;
        } else {
            // Placeholder for other types
            previewHtml = `<div style="padding:10px; background:#f9f9f9;">プレビュー...</div>`;
        }

        return `
            <div class="question-item"
                 draggable="true"
                 ondragstart="AdminView.handleDragStart(event, ${index})"
                 ondragend="AdminView.handleDragEnd(event)"
                 ondragover="AdminView.handleDragOver(event)"
                 ondrop="AdminView.handleDrop(event, ${index})"
                 style="border: 1px solid #eee; padding: 15px; border-radius: 8px; position: relative; background: white; transition: 0.2s;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;">
                    <div style="cursor: move; padding: 5px; color: #aaa; display: flex; align-items: center;" title="ドラッグして移動">
                        <i class="ph ph-list" style="font-size: 1.5em;"></i>
                    </div>
                    <div style="flex-shrink: 0;">
                        <label style="font-size: 0.8em; color: #888; display: block; margin-bottom: 2px;">タイプ</label>
                        <select class="q-type" onchange="AdminView.updateQuestionType(${index}, this.value)" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="rating" ${question.type === 'rating' ? 'selected' : ''}>5段階評価</option>
                            <option value="yesno" ${question.type === 'yesno' ? 'selected' : ''}>はい・いいえ</option>
                            <option value="text" ${question.type === 'text' ? 'selected' : ''}>テキスト入力</option>
                            <option value="checkbox" ${question.type === 'checkbox' ? 'selected' : ''}>チェックボックス</option>
                        </select>
                    </div>
                    <div style="flex-grow: 1;">
                        <label style="font-size: 0.8em; color: #888; display: block; margin-bottom: 2px;">質問文</label>
                        <input type="text" class="q-text" onchange="AdminView.updateQuestionText(${index}, this.value)" value="${question.text}" placeholder="質問文" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                    </div>
                    <button onclick="AdminView.deleteQuestion(${index})" style="background: #ff7675; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; margin-top: 18px;">×</button>
                </div>
                ${previewHtml}
            </div>
        `;
    },

    showCafeteriaManager() {
        const content = document.getElementById('admin-content');
        const cafeterias = DataService.getCafeterias();
        const surveys = DataService.getSurveys();

        content.innerHTML = `
            <h1>食堂管理</h1>

            <div class="card" style="background: white; padding: 30px; border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-top: 20px;">
                <h3>新規食堂登録</h3>
                <form onsubmit="AdminView.addCafeteria(event)" style="display: flex; gap: 10px; margin-top: 20px; align-items: flex-end;">
                    <div style="flex-grow: 1;">
                        <label>食堂番号 (ID)</label>
                        <input type="text" name="id" required style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    </div>
                    <div style="flex-grow: 2;">
                        <label>食堂名</label>
                        <input type="text" name="name" required style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    </div>
                    <div style="flex-grow: 1;">
                        <label>パスワード</label>
                        <input type="text" name="password" required value="pass" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    </div>
                    <div style="flex-grow: 2;">
                        <label>割当アンケート</label>
                        <select name="assignedSurveyId" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">
                            ${surveys.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="height: 40px; white-space: nowrap; min-width: 80px;">登録</button>
                </form>
            </div>

            <div class="card" style="background: white; padding: 30px; border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-top: 30px;">
                <h3>登録済み食堂一覧</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #f1f2f6; text-align: left;">
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">食堂名</th>
                            <th style="padding: 10px;">パスワード</th>
                            <th style="padding: 10px;">割当アンケート</th>
                            <th style="padding: 10px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cafeterias.map(c => {
            const assignedSurvey = surveys.find(s => s.id === c.assignedSurveyId);
            const surveyTitle = assignedSurvey ? assignedSurvey.title : '未設定';
            return `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px;">${c.id}</td>
                                <td style="padding: 10px;">${c.name}</td>
                                <td style="padding: 10px;">${c.password}</td>
                                <td style="padding: 10px;">
                                    <select onchange="AdminView.updateCafeteriaSurvey('${c.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ddd;">
                                        ${surveys.map(s => `<option value="${s.id}" ${c.assignedSurveyId === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}
                                    </select>
                                </td>
                                <td style="padding: 10px;">
                                    <button onclick="AdminView.deleteCafeteria('${c.id}')" style="color: #ff7675; background: none; border: none; cursor: pointer; font-weight: bold;">削除</button>
                                </td>
                            </tr>
                        `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    addCafeteria(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newCafeteria = {
            id: formData.get('id'),
            name: formData.get('name'),
            password: formData.get('password'),
            assignedSurveyId: formData.get('assignedSurveyId')
        };

        const cafeterias = DataService.getCafeterias();
        if (cafeterias.some(c => c.id === newCafeteria.id)) {
            alert('このIDは既に使われています');
            return;
        }

        cafeterias.push(newCafeteria);
        DataService.saveCafeterias(cafeterias);
        this.showCafeteriaManager();
    },

    updateCafeteriaSurvey(cafeteriaId, surveyId) {
        const cafeterias = DataService.getCafeterias();
        const cafeteria = cafeterias.find(c => c.id === cafeteriaId);
        if (cafeteria) {
            cafeteria.assignedSurveyId = surveyId;
            DataService.saveCafeterias(cafeterias);
        }
    },

    deleteCafeteria(id) {
        if (!confirm('本当に削除しますか？')) return;
        let cafeterias = DataService.getCafeterias();
        cafeterias = cafeterias.filter(c => c.id !== id);
        DataService.saveCafeterias(cafeterias);
        this.showCafeteriaManager();
    },

    // --- DnD Helpers (Questions) ---
    dragSrcIndex: null,

    handleDragStart(e, index) {
        // Stop option listeners from firing (not really needed since targets differ but safety)
        if (e.target.tagName === 'LI') return;
        this.dragSrcIndex = index; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); e.target.style.opacity = '0.4';
    },
    handleDragEnd(e) { e.target.style.opacity = '1'; this.dragSrcIndex = null; },
    handleDragOver(e) { if (e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; },
    handleDrop(e, index) {
        if (e.stopPropagation) e.stopPropagation();
        if (this.dragSrcIndex !== null && this.dragSrcIndex !== index) {
            const surveys = DataService.getSurveys();
            if (!this.currentSurveyId) return; // Should not happen
            const survey = surveys.find(s => s.id === this.currentSurveyId);
            const questions = survey.questions;
            const [movedItem] = questions.splice(this.dragSrcIndex, 1);
            questions.splice(index, 0, movedItem);
            DataService.saveSurvey(survey);
            this.showEditor(this.currentSurveyId);
        }
        return false;
    },

    // --- DnD Helpers (Options) ---
    dragOptIndex: null,
    dragOptQIndex: null,
    handleOptionDragStart(e, qIndex, oIndex) {
        e.stopPropagation();
        this.dragOptQIndex = qIndex;
        this.dragOptIndex = oIndex;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.4';
    },
    handleOptionDragEnd(e) {
        e.target.style.opacity = '1';
        this.dragOptIndex = null;
        this.dragOptQIndex = null;
    },
    handleOptionDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    },
    handleOptionDrop(e, qIndex, oIndex) {
        e.stopPropagation();
        if (this.dragOptQIndex === qIndex && this.dragOptIndex !== null && this.dragOptIndex !== oIndex) {
            const surveys = DataService.getSurveys();
            const survey = surveys.find(s => s.id === this.currentSurveyId);
            const options = survey.questions[qIndex].options;

            const [moved] = options.splice(this.dragOptIndex, 1);
            options.splice(oIndex, 0, moved);

            DataService.saveSurvey(survey);
            this.showEditor(this.currentSurveyId);
        }
        return false;
    },

    // --- Generic Helpers ---
    addQuestion() {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions.push({ id: 'q' + Date.now(), type: 'rating', text: '' });
        DataService.saveSurvey(survey);
        this.showEditor(this.currentSurveyId);
    },
    deleteQuestion(index) {
        if (!confirm('削除しますか')) return;
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions.splice(index, 1);
        DataService.saveSurvey(survey);
        this.showEditor(this.currentSurveyId);
    },
    updateQuestionType(index, type) { /* ... same logic ... */
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions[index].type = type;
        DataService.saveSurvey(survey);
        this.showEditor(this.currentSurveyId);
    },
    updateQuestionText(index, text) {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions[index].text = text;
        DataService.saveSurvey(survey);
    },
    updateQuestionMaxSelect(index, val) {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions[index].maxSelections = parseInt(val);
        DataService.saveSurvey(survey);
    },
    addOption(index) {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        if (!survey.questions[index].options) survey.questions[index].options = [];
        survey.questions[index].options.push('選択肢');
        DataService.saveSurvey(survey);
        this.showEditor(this.currentSurveyId);
    },
    removeOption(qIndex, oIndex) {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions[qIndex].options.splice(oIndex, 1);
        DataService.saveSurvey(survey);
        this.showEditor(this.currentSurveyId);
    },
    updateOption(qIndex, oIndex, val) {
        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === this.currentSurveyId);
        survey.questions[qIndex].options[oIndex] = val;
        DataService.saveSurvey(survey);
    },
    saveSurvey() {
        // ... (Title needs to be grabbed from active DOM which is tricky if multiple inputs exist, but here we only have one #survey-title)
        const titleInput = document.getElementById('survey-title');
        if (titleInput && this.currentSurveyId) {
            const surveys = DataService.getSurveys();
            const survey = surveys.find(s => s.id === this.currentSurveyId);
            survey.title = titleInput.value;
            DataService.saveSurvey(survey);
        }
        alert('保存しました');
    },

    downloadCSV(surveyId, cafeteriaFilter) {
        if (!surveyId) return alert('アンケートが選択されていません');

        const surveys = DataService.getSurveys();
        const survey = surveys.find(s => s.id === surveyId);

        const allResponses = DataService.getResponses();
        const surveyResponses = allResponses.filter(r => r.surveyId === surveyId);
        const responses = cafeteriaFilter === 'all'
            ? surveyResponses
            : surveyResponses.filter(r => r.cafeteriaId === cafeteriaFilter);

        if (responses.length === 0) {
            alert('データがありません');
            return;
        }

        // Add BOM for Excel compatibility in Japanese environments
        const BOM = '\uFEFF';
        const csvContent = DataService.exportToCSV(responses, survey);
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        // Format: YYYY-MM-DD_Title
        const now = new Date();
        const timestamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        link.setAttribute('download', `${timestamp}_${survey.title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
