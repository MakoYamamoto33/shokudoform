const DataService = {
    init() {
        if (!localStorage.getItem('surveys')) {
            const initialSurveys = [
                {
                    id: 's1',
                    title: '日替わりランチについて',
                    questions: [
                        { id: 'q1', type: 'rating', text: '味はどうでしたか？' },
                        { id: 'q2', type: 'yesno', text: '量は十分でしたか？' },
                        { id: 'q3', type: 'text', text: 'ご意見・ご感想をお願いします。' }
                    ],
                    active: true
                }
            ];
            localStorage.setItem('surveys', JSON.stringify(initialSurveys));
        }
        if (!localStorage.getItem('responses')) {
            localStorage.setItem('responses', JSON.stringify([]));
        }
        if (!localStorage.getItem('cafeterias')) {
            const initialCafeterias = [
                { id: '001', name: '第一食堂', password: 'pass', assignedSurveyId: 's1' },
                { id: '002', name: '第二食堂', password: 'pass', assignedSurveyId: 's1' }
            ];
            localStorage.setItem('cafeterias', JSON.stringify(initialCafeterias));
        }
    },

    login(id, password, type) {
        if (type === 'admin') {
            return id === '1234' && password === '1234';
        } else {
            const cafeterias = this.getCafeterias();
            const cafeteria = cafeterias.find(c => c.id === id);
            return cafeteria && cafeteria.password === password;
        }
    },

    getSurveys() {
        return JSON.parse(localStorage.getItem('surveys') || '[]');
    },

    saveSurvey(survey) {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(s => s.id === survey.id);
        if (index >= 0) {
            surveys[index] = survey;
        } else {
            surveys.push(survey);
        }
        localStorage.setItem('surveys', JSON.stringify(surveys));
    },

    submitResponse(response) {
        const responses = this.getResponses();
        // Add metadata
        response.id = 'r' + Date.now();
        response.timestamp = new Date().toISOString(); // ISO format for easy parsing
        responses.push(response);
        localStorage.setItem('responses', JSON.stringify(responses));
    },

    exportToCSV(responses, survey) {
        // Headers
        const headers = ['回答ID', '日時', '食堂ID'];
        survey.questions.forEach((q, i) => headers.push(`Q${i + 1}: ${q.text}`));

        // Rows
        const rows = responses.map(r => {
            const row = [r.id, new Date(r.timestamp).toLocaleString(), r.cafeteriaId];
            survey.questions.forEach(q => {
                let ans = r.answers[q.id] || '';
                if (Array.isArray(ans)) ans = ans.join(', '); // Handle checkboxes
                // Escape quotes for CSV
                ans = `"${String(ans).replace(/"/g, '""')}"`;
                row.push(ans);
            });
            return row.join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    },
    getResponses() {
        return JSON.parse(localStorage.getItem('responses') || '[]');
    },

    getCafeterias() {
        return JSON.parse(localStorage.getItem('cafeterias') || '[]');
    },

    saveCafeterias(cafeterias) {
        localStorage.setItem('cafeterias', JSON.stringify(cafeterias));
    }
};
