document.addEventListener('DOMContentLoaded', () => {
    const headerLogo = document.getElementById('header-logo');
    headerLogo.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    const Github_btn = document.getElementById('header-github');
    Github_btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://github.com/Joao-Pedro-Monteiro')
    })
})