import React from 'react';
import ReactDOM from 'react-dom/client';
import {  BrowserRouter, Routes, Route} from 'react-router-dom';
import './styles/index.css';
import App from './App';
import Main from './EditableTable';
import LogsViewer from './LogsViewer';
import OptionsPage from './OptionsPage';
import Unauthorized from './Unauthorized';
import NotFound from './NotFound';
import ImportData from './ImportData';
import InstructionPage from './InstructionSimple';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
  <Routes>
      <Route path="/" element={<App />}/>
      <Route path="/main" element={<Main />}/>
      <Route path="/logs" element={<LogsViewer />}/>
      <Route path="/options" element={<OptionsPage />}/>
      <Route path="/unauthorized" element={<Unauthorized />}/>
      <Route path="*" element={<NotFound />} />
      <Route path="/import" element={<ImportData />} />
      <Route path="/instruction" element={<InstructionPage />} />
  </Routes>
</BrowserRouter>
);

