import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InstructionSimple.css';

const InstructionSimple = () => {
  const navigate = useNavigate();

  const goBackToTable = () => {
    navigate(-1);
  };

  return (
    <div className="instr-simple-container">
      <div className="instr-simple-wrapper">
        <button className="instr-back-button" onClick={goBackToTable}>
          ← Назад к таблице
        </button>

        <div className="instr-simple-header">
          <h1>Инструкция по работе с таблицей ординаторов</h1>
          <p>Краткое руководство для всех пользователей</p>
        </div>

        <div className="instr-simple-toc">
          <span>Содержание:</span>
          <a href="#basics">1. Основы</a>
          <a href="#search">2. Поиск и фильтры</a>
          <a href="#edit">3. Редактирование</a>
          <a href="#actions">4. Действия с записями</a>
          <a href="#export">5. Экспорт и справки</a>
          <a href="#roles">6. Права доступа</a>
        </div>

        <div id="basics" className="instr-simple-section">
          <h2>1. Основы работы с таблицей</h2>
          
          <div className="instr-simple-card">
            <h3>Что здесь можно делать?</h3>
            <ul>
              <li><strong>Просматривать</strong> список всех ординаторов (40 колонок информации)</li>
              <li><strong>Искать</strong> нужных людей по любому полю</li>
              <li><strong>Редактировать</strong> данные через модальное окно</li>
              <li><strong>Добавлять</strong> новых ординаторов</li>
              <li><strong>Удалять</strong> записи (по одной или несколько сразу)</li>
              <li><strong>Экспортировать</strong> данные в Excel или Word</li>
              <li><strong>Генерировать</strong> справки</li>
            </ul>
          </div>

          <div className="instr-simple-card">
            <h3>Как ориентироваться в таблице?</h3>
            <ul>
              <li><strong>Строки</strong> — это ординаторы (по 10 на странице)</li>
              <li><strong>Колонки</strong> — это разные данные (ФИО, даты, документы и т.д.)</li>
              <li><strong>Кнопки внизу</strong> — «‹», «›», «1», «2» — переключение страниц</li>
              <li><strong>Клик на заголовке колонки</strong> — сортировка (стрелка вверх/вниз)</li>
            </ul>
          </div>
        </div>

        <div id="search" className="instr-simple-section">
          <h2>2. Поиск и фильтры</h2>
          
          <div className="instr-simple-card">
            <h3>Быстрый поиск (над таблицей)</h3>
            <ol>
              <li>Введите текст в поле для поиска</li>
              <li>Выберите, где искать: <strong>«Все колонки»</strong> или конкретную (например, «ФИО»)</li>
              <li>Таблица покажет только подходящие записи</li>
            </ol>
            <div className="instr-simple-tip">Чтобы сбросить поиск — нажмите кнопку «Сброс»</div>
          </div>

          <div className="instr-simple-card">
            <h3>Расширенные фильтры (кнопка «Фильтры»)</h3>
            <ol>
              <li>Нажмите <strong>«Фильтры»</strong> → откроется панель</li>
              <li>Нажмите <strong>«+ Добавить фильтр»</strong></li>
              <li>Выберите колонку, условие (Содержит, Равно, Больше и т.д.) и значение</li>
              <li>Если фильтров несколько — выберите логику: <strong>«И»</strong> (все условия) или <strong>«ИЛИ»</strong> (любое)</li>
            </ol>
            <div className="instr-simple-tip">Пример: «ФИО содержит Иванов» И «Страна Беларусь»</div>
          </div>
        </div>

        <div id="edit" className="instr-simple-section">
          <h2>3. Редактирование данных</h2>
          
          <div className="instr-simple-card">
            <h3>Быстрое редактирование (прямо в таблице)</h3>
            <ol>
              <li><strong>Дважды кликните</strong> по любой ячейке</li>
              <li>Введите новое значение</li>
              <li>Нажмите Enter для сохранения или Escape для отмены</li>
            </ol>
            <div className="instr-simple-warning">Для дат используйте формат: <strong>ДД.ММ.ГГГГ</strong> (например, 15.05.2024)</div>
          </div>

          <div className="instr-simple-card">
            <h3>Полное редактирование (все поля)</h3>
            <ol>
              <li><strong>Дважды кликните</strong> по левой колонке с чекбоксом</li>
              <li>Откроется модальное окно со всеми полями записи</li>
              <li>Измените нужные данные</li>
              <li>Нажмите <strong>«Сохранить изменения»</strong></li>
            </ol>
          </div>

          <div className="instr-simple-card">
            <h3>Как редактировать вложенные данные?</h3>
            <p>Некоторые поля содержат несколько записей внутри:</p>
            <ul>
              <li><strong>Социальный отпуск</strong> — можно добавить несколько периодов</li>
              <li><strong>Руководители</strong> — можно добавить нескольких руководителей</li>
              <li><strong>Продления</strong> и <strong>Надбавки</strong> — аналогично</li>
            </ul>
            <p>Внутри такого поля есть кнопки:<br/>
              «Добавить» — новая запись<br/>
              «Удалить» — удалить запись<br/>
              «Сохранить» — сохранить все изменения внутри этого поля</p>
          </div>
        </div>

        <div id="actions" className="instr-simple-section">
          <h2>4. Действия с записями</h2>
          
          <div className="instr-simple-card">
            <h3>Как выбрать записи?</h3>
            <ul>
              <li>Поставьте <strong>галочку</strong> в первом столбце слева — выберется одна запись</li>
              <li>Поставьте <strong>галочку в шапке таблицы</strong> — выберутся все записи (с учётом фильтра)</li>
              <li>Сверху будет видно, сколько записей выбрано</li>
            </ul>
          </div>

          <div className="instr-simple-card">
            <h3>Создание новой записи</h3>
            <ol>
              <li>Нажмите кнопку <strong>«Создать»</strong> над таблицей</li>
              <li>Заполните поля в открывшемся окне</li>
              <li>Нажмите <strong>«Создать ординатора»</strong></li>
            </ol>
            <div className="instr-simple-tip">Доступно только для ролей: Администратор и Диспетчер</div>
          </div>

          <div className="instr-simple-card">
            <h3>Удаление записей</h3>
            <ul>
              <li><strong>Одну запись:</strong> выберите запись галочкой → нажмите «Удалить выбранные»</li>
              <li><strong>Несколько записей:</strong> отметьте их галочками → нажмите «Удалить выбранные» → подтвердите</li>
            </ul>
            <div className="instr-simple-warning">Удаление НЕОБРАТИМО! Будьте внимательны.</div>
          </div>
        </div>

        <div id="export" className="instr-simple-section">
          <h2>5. Экспорт и генерация справок</h2>
          
          <div className="instr-simple-card">
            <h3>Экспорт данных</h3>
            <ol>
              <li>Выберите записи (галочками)</li>
              <li>Нажмите <strong>«Экспорт (N)»</strong></li>
              <li>В первой панели отметьте колонки, которые нужны в файле</li>
              <li>Во второй панели выберите форматы: <strong>Excel</strong> и/или <strong>Word</strong></li>
              <li>Нажмите <strong>«Выполнить экспорт»</strong></li>
            </ol>
            <div className="instr-simple-tip">Файлы сохранятся в папку «Загрузки» с названием: ординаторы_2024-01-01_5записей.xlsx</div>
          </div>

          <div className="instr-simple-card">
            <h3>Генерация справок</h3>
            <ol>
              <li>Выберите записи (галочками)</li>
              <li>Нажмите <strong>«Справки (N)»</strong></li>
              <li>Отметьте нужные типы справок</li>
              <li>Нажмите <strong>«Сгенерировать справки»</strong></li>
            </ol>
            <div className="instr-simple-tip">После генерации появится отчёт об успешных и ошибочных справках</div>
          </div>
        </div>

        <div id="roles" className="instr-simple-section">
          <h2>6. Права доступа по ролям</h2>
          
          <div className="instr-simple-table-wrapper">
            <table className="instr-simple-table">
              <thead>
                <tr><th>Роль</th><th>Что может делать</th></tr>
              </thead>
              <tbody>
                <tr className="instr-simple-row-admin"><td> Администратор</td><td>Всё: создавать, редактировать, удалять, справки, экспорт, админ-панель</td></tr>
                <tr className="instr-simple-row-dispatcher"><td> Диспетчер</td><td>Всё: создавать, редактировать, удалять, справки, экспорт, админ-панель</td></tr>
                <tr className="instr-simple-row-passportist"><td> Паспортист</td><td>Просмотр и редактирование полей паспортных данных (не может создавать и удалять)</td></tr>
                <tr className="instr-simple-row-supervisor"><td> Руководитель</td><td>Просмотр и экспорт</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="instr-simple-faq">
          <h2>Частые вопросы</h2>
          
          <div className="instr-simple-question">
            <div className="instr-simple-q">Почему я не могу редактировать ячейку?</div>
            <div className="instr-simple-a">Проверьте свою роль. Редактировать могут только Администратор, Диспетчер и Паспортист.</div>
          </div>
          
          <div className="instr-simple-question">
            <div className="instr-simple-q">Как добавить новый вариант в выпадающий список?</div>
            <div className="instr-simple-a">Начните вводить текст — появится опция «Создать "..."». Нажмите на неё.</div>
          </div>
          
          <div className="instr-simple-question">
            <div className="instr-simple-q">Данные сохраняются автоматически?</div>
            <div className="instr-simple-a">Нет. Только после нажатия кнопки «Сохранить». Если закрыть редактор без сохранения — изменения пропадут.</div>
          </div>
          
          <div className="instr-simple-question">
            <div className="instr-simple-q">Как обновить таблицу, если кто-то изменил данные?</div>
            <div className="instr-simple-a">Нажмите на свой профиль (левый верхний угол) → выберите «Обновить данные».</div>
          </div>
        </div>

        <div className="instr-simple-footer">
          <p>Система управления ординаторами</p>
          <p>Вопросы и проблемы: тел. 279-42-14</p>
        </div>
      </div>
    </div>
  );
};

export default InstructionSimple;