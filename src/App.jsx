import './App.css';
import React from 'react';

function App() {
  return (
    <div className='App'>
      <div className='div-app'>
        <div className='div-input'>
          <p className='p-aut'>Логин</p>
            <input className='input-aut'>

            </input>
          <p className='p-aut'>Пароль</p>
            <input className='input-aut'>

            </input>
            <button>
              Войти
            </button>
          </div>
        </div>
    </div>
  );
}

export default App;
