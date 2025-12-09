const App = {
    init() {
        DataService.init();
        this.render();
        window.addEventListener('hashchange', () => this.render());
    },

    render() {
        const app = document.getElementById('app');
        const hash = window.location.hash || '#login'; // Default to login

        // Simple router
        if (hash === '#login') {
            this.renderLogin(app);
        } else if (hash === '#admin') {
            if (!this.checkAuth('admin')) return;
            AdminView.render(app);
        } else if (hash.startsWith('#user')) {
            if (!this.checkAuth('user')) return;
            UserView.render(app);
        } else {
            window.location.hash = '#login';
        }
    },

    renderLogin(container) {
        container.innerHTML = `
            <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 2rem;">
                <h1>食堂アンケートシステム</h1>
                <div style="display: flex; gap: 2rem;">
                    <div class="card login-card" style="padding: 2rem; border-radius: 12px; background: #f0f0f0; width: 300px;">
                        <h2>管理者ログイン</h2>
                        <form onsubmit="App.handleLogin(event, 'admin')">
                            <input type="text" name="id" placeholder="ID" required style="width: 100%; padding: 10px; margin: 10px 0;">
                            <input type="password" name="password" placeholder="Password" required style="width: 100%; padding: 10px; margin: 10px 0;">
                            <button type="submit" class="btn btn-primary" style="width: 100%;">ログイン</button>
                        </form>
                    </div>
                    <div class="card login-card" style="padding: 2rem; border-radius: 12px; background: #e0f7fa; width: 300px;">
                        <h2>食堂ログイン</h2>
                        <form onsubmit="App.handleLogin(event, 'user')">
                            <input type="text" name="id" placeholder="食堂番号" required style="width: 100%; padding: 10px; margin: 10px 0;">
                            <input type="password" name="password" placeholder="Password" required style="width: 100%; padding: 10px; margin: 10px 0;">
                            <button type="submit" class="btn btn-secondary" style="width: 100%;">ログイン</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    handleLogin(event, type) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const id = formData.get('id');
        const password = formData.get('password');

        if (DataService.login(id, password, type)) {
            if (type === 'admin') {
                sessionStorage.setItem('role', 'admin');
                window.location.hash = '#admin';
            } else {
                sessionStorage.setItem('role', 'user');
                sessionStorage.setItem('cafeteriaId', id);
                window.location.hash = '#user';
            }
        } else {
            alert('ログインに失敗しました。IDまたはパスワードが間違っています。');
        }
    },

    checkAuth(role) {
        const currentRole = sessionStorage.getItem('role');
        if (currentRole !== role && currentRole !== 'admin') { // Admin can access everything usually, but here strict separation might be better? Let's keep strict for now.
            // Actually, admin typically shouldn't see the user survey view in the same session context unless navigating explicitly.
            // For now, simple check.
            if (role === 'user' && currentRole === 'user') return true;
            if (role === 'admin' && currentRole === 'admin') return true;

            window.location.hash = '#login';
            return false;
        }
        return true;
    },

    logout() {
        sessionStorage.clear();
        window.location.hash = '#login';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
