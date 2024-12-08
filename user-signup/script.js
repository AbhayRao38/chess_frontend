const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});
// const firstbox = document.getElementById('firstbox');
// const btn = document.querySelector('btn');
// btn.addEventListener('click', () => {
//     firstbox.classList.toggle('hidediv');
//     firstbox.style.backgroundColor = 'blue';
// });
