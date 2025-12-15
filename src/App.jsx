import './App.css';
import React from 'react';

function App() {
  return (
    <div className='App'>
      <div className='div-app'>
        <div className='div-input'>
          <p className='p-auth'>Логин</p>
            <input className='input-auth'>

            </input>
          <p className='p-auth'>Пароль</p>
            <input className='input-auth'>

            </input>
            <p></p>
            <button className='button-auth'>
              Войти
            </button>
          </div>
        </div>
    </div>
  );
}

export default App;
